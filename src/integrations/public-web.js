import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { assertPublicTarget } from '../domain/target-policy.js';

const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15000;
const USER_AGENT = 'WebReceipt/2.0 (+https://github.com/SaiKrishna181707/webReceipt; public deal evidence collector)';
const UNKNOWN_TERM = 'Not stated on captured public page';

function decodeEntities(value = '') {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return String(value)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => named[name.toLowerCase()] ?? m);
}

function attrs(tag) {
  const out = {};
  const re = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match;
  while ((match = re.exec(tag))) out[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  return out;
}

function metaContent(html, names) {
  const wanted = new Set(names.map((x) => x.toLowerCase()));
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(match[0]);
    const key = String(a.property || a.name || a.itemprop || '').toLowerCase();
    if (wanted.has(key) && a.content) return a.content.trim();
  }
  return '';
}

function firstTagText(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? cleanText(match[1]) : '';
}

function cleanText(value = '') {
  return decodeEntities(String(value)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|section|article|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[\t\f\r ]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeAmount(value) {
  let raw = String(value ?? '').trim().replace(/\s+/g, '').replace(/[^0-9,.-]/g, '');
  if (!raw) return null;
  const negative = raw.startsWith('-');
  raw = raw.replace(/-/g, '');
  const comma = raw.lastIndexOf(',');
  const dot = raw.lastIndexOf('.');
  const lastSep = Math.max(comma, dot);
  let normalized;
  if (lastSep >= 0) {
    const decimals = raw.length - lastSep - 1;
    const decimalLike = decimals === 1 || decimals === 2;
    if (decimalLike) {
      normalized = `${raw.slice(0, lastSep).replace(/[.,]/g, '')}.${raw.slice(lastSep + 1).replace(/[.,]/g, '')}`;
    } else {
      normalized = raw.replace(/[.,]/g, '');
    }
  } else normalized = raw;
  const amount = Number(`${negative ? '-' : ''}${normalized}`);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function currencyFrom(value = '') {
  const text = String(value).toUpperCase();
  if (/\bINR\b/.test(text) || text.includes('₹')) return 'INR';
  if (/\bEUR\b/.test(text) || text.includes('€')) return 'EUR';
  if (/\bGBP\b/.test(text) || text.includes('£')) return 'GBP';
  if (/\bUSD\b/.test(text) || text.includes('$')) return 'USD';
  return '';
}

function collectJsonLd(html) {
  const values = [];
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].trim());
      values.push(parsed);
    } catch {
      // Invalid third-party JSON-LD is ignored; other extraction paths remain available.
    }
  }
  return values;
}

function walk(value, visit, path = []) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, visit, [...path, i]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  visit(value, path);
  for (const [key, child] of Object.entries(value)) walk(child, visit, [...path, key]);
}

function jsonLdDeal(html) {
  let best = null;
  let subject = '';
  for (const root of collectJsonLd(html)) {
    walk(root, (node) => {
      const type = Array.isArray(node['@type']) ? node['@type'].join(' ') : String(node['@type'] || '');
      if (!subject && typeof node.name === 'string' && /product|offer|hotel|lodging|event|ticket/i.test(type)) subject = node.name.trim();
      const directPrice = node.price ?? node.lowPrice ?? node.highPrice ?? node?.priceSpecification?.price;
      const amount = normalizeAmount(directPrice);
      if (amount == null) return;
      const currency = String(node.priceCurrency || node?.priceSpecification?.priceCurrency || '').trim().toUpperCase();
      const score = (/offer/i.test(type) ? 5 : 0) + (node.price != null ? 4 : 0) + (currency ? 2 : 0);
      if (!best || score > best.score) best = { amount, currency, score, raw: String(directPrice) };
    });
  }
  return { best, subject };
}

function tagPrice(html) {
  for (const match of html.matchAll(/<(?:meta|data|span|div)\b[^>]*>/gi)) {
    const a = attrs(match[0]);
    const marker = `${a.property || ''} ${a.name || ''} ${a.itemprop || ''} ${a['data-testid'] || ''}`.toLowerCase();
    if (!/(?:^|\s|:)(price|amount|sale_price|final_price)(?:$|\s|:)/.test(marker)) continue;
    const raw = a.content || a.value || a['data-price'] || '';
    const amount = normalizeAmount(raw);
    if (amount != null) return { amount, currency: currencyFrom(`${a.currency || ''} ${raw}`), raw };
  }
  const explicit = metaContent(html, ['product:price:amount', 'og:price:amount', 'price', 'twitter:data1']);
  const amount = normalizeAmount(explicit);
  if (amount != null) return { amount, currency: currencyFrom(explicit), raw: explicit };
  return null;
}

function visiblePrice(text) {
  const patterns = [
    /(?:₹|\$|€|£|\bINR\b|\bUSD\b|\bEUR\b|\bGBP\b)\s*([0-9][0-9.,]*)/i,
    /([0-9][0-9.,]*)\s*(?:\bINR\b|\bUSD\b|\bEUR\b|\bGBP\b)/i,
  ];
  const lines = String(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const prioritized = [...lines.filter((line) => /price|total|from|sale|now|deal|₹|\$|€|£/i.test(line)), ...lines];
  for (const line of prioritized) {
    for (const re of patterns) {
      const match = line.match(re);
      if (!match) continue;
      const amount = normalizeAmount(match[1]);
      if (amount != null) return { amount, currency: currencyFrom(match[0]), raw: match[0], snippet: line.slice(0, 240) };
    }
  }
  return null;
}

function nearby(text, re, fallback = UNKNOWN_TERM) {
  const lines = String(text).split(/\n+/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const line = lines.find((value) => re.test(value));
  return line ? line.slice(0, 360) : fallback;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function parsePublicDealHtml(html, { url, observedAt = new Date().toISOString() } = {}) {
  if (!url) throw new Error('Public web collector requires targetUrl.');
  const text = cleanText(html);
  const ld = jsonLdDeal(html);
  const tagged = tagPrice(html);
  const visible = visiblePrice(text);
  const candidate = ld.best || tagged || visible;
  if (!candidate) {
    throw new Error('No public price was found on this page. WebReceipt captures public deal, product, hotel, ticket, and checkout pages with a visible monetary amount.');
  }

  const metaCurrency = metaContent(html, ['product:price:currency', 'og:price:currency', 'pricecurrency']);
  const currency = String(candidate.currency || metaCurrency || currencyFrom(candidate.raw) || currencyFrom(text)).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('A public price was found, but its currency could not be identified reliably. Use a page that displays a currency symbol or ISO currency code.');
  }

  const subject = ld.subject || metaContent(html, ['og:title', 'twitter:title']) || firstTagText(html, 'title') || firstTagText(html, 'h1') || new URL(url).hostname;
  const description = metaContent(html, ['description', 'og:description', 'twitter:description']);
  const cancellation = nearby(text, /cancel|cancellation/i);
  const refundability = nearby(text, /refund|refundable|non-refundable/i);
  const paymentTiming = nearby(text, /pay now|payment|charged|due today|pay at|pay later/i);
  const inclusion = nearby(text, /include|included|inclusion/i, '');
  const amount = candidate.amount;
  const priceEvidence = visible?.snippet || candidate.raw || `${currency} ${amount}`;
  const collectorVersion = 'webreceipt-public-web-v1';
  const sourceUrl = url;

  return {
    subject: subject.slice(0, 240),
    targetUrl: sourceUrl,
    observedAt,
    locale: 'en',
    currency,
    collectorId: 'webreceipt-public-web',
    collectorVersion,
    worker: 'server-html',
    offer: {
      advertisedPrice: amount,
      claims: [description, 'Single-page public capture; fees, taxes, and checkout-only terms are not inferred when they are not present on the captured page.'].filter(Boolean).slice(0, 4),
    },
    checkout: {
      basePrice: amount,
      feeItems: [],
      mandatoryFees: 0,
      taxes: 0,
      optionalAddons: 0,
      discounts: 0,
      finalTotal: amount,
    },
    terms: {
      cancellation,
      refundability,
      paymentTiming,
      inclusions: inclusion ? [inclusion] : [],
    },
    journey: [
      { label: 'Public offer capture', url: sourceUrl, displayedPrice: amount, evidenceId: 'ev_offer' },
      { label: 'Displayed price snapshot', url: sourceUrl, displayedPrice: amount, evidenceId: 'ev_total' },
    ],
    evidence: [
      { id: 'ev_offer', field: 'offer.advertisedPrice', sourceUrl, capturedText: priceEvidence, domPath: 'public page price signal', screenshotRef: null, journeyStep: 1, observedAt, collectorVersion },
      { id: 'ev_base', field: 'checkout.basePrice', sourceUrl, capturedText: priceEvidence, domPath: 'single-page price baseline', screenshotRef: null, journeyStep: 2, observedAt, collectorVersion },
      { id: 'ev_total', field: 'checkout.finalTotal', sourceUrl, capturedText: priceEvidence, domPath: 'single-page displayed price', screenshotRef: null, journeyStep: 2, observedAt, collectorVersion },
      { id: 'ev_cancel', field: 'terms.cancellation', sourceUrl, capturedText: cancellation === UNKNOWN_TERM ? 'No cancellation wording detected in captured public page text.' : cancellation, domPath: cancellation === UNKNOWN_TERM ? 'document (absence check)' : 'public page text', screenshotRef: null, journeyStep: 2, observedAt, collectorVersion },
    ],
  };
}

function isPublicIpv4(address) {
  const p = address.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b, c] = p;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

function isPublicIp(address) {
  const kind = net.isIP(address);
  if (kind === 4) return isPublicIpv4(address);
  if (kind !== 6) return false;
  const host = address.toLowerCase();
  if (host === '::' || host === '::1' || host.startsWith('::ffff:')) return false;
  if (/^f[cd][0-9a-f]{2}:/i.test(host) || /^fe[89ab][0-9a-f]:/i.test(host)) return false;
  if (/^2001:db8:/i.test(host)) return false;
  const first = parseInt(host.split(':')[0] || '0', 16);
  return first >= 0x2000 && first <= 0x3fff;
}

async function lookupPublic(hostname) {
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error('Target hostname did not resolve to a public address.');
  if (addresses.some((item) => !isPublicIp(item.address))) {
    throw new Error('Target hostname resolves to a private, reserved, or non-public network address.');
  }
  return addresses[0];
}

async function readHtmlUrl(rawUrl, redirects = 0) {
  if (redirects > MAX_REDIRECTS) throw new Error(`Public page redirected more than ${MAX_REDIRECTS} times.`);
  const normalized = assertPublicTarget(rawUrl);
  const target = new URL(normalized);
  const resolved = await lookupPublic(target.hostname);
  const transport = target.protocol === 'https:' ? https : http;

  const response = await new Promise((resolve, reject) => {
    const req = transport.request(target, {
      method: 'GET',
      family: resolved.family,
      autoSelectFamily: false,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.7,*/*;q=0.1',
        'accept-encoding': 'identity',
        'accept-language': 'en-US,en;q=0.8',
      },
      lookup: (_hostname, _options, callback) => callback(null, resolved.address, resolved.family),
    }, (res) => resolve(res));
    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error(`Public page request timed out after ${REQUEST_TIMEOUT_MS}ms.`)));
    req.end();
  });

  const status = response.statusCode || 0;
  if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
    response.resume();
    const next = new URL(response.headers.location, target).toString();
    return readHtmlUrl(next, redirects + 1);
  }
  if (status < 200 || status >= 300) {
    response.resume();
    throw new Error(`Public page returned HTTP ${status}.`);
  }
  const type = String(response.headers['content-type'] || '').toLowerCase();
  if (type && !/(text\/html|application\/xhtml\+xml|text\/plain)/.test(type)) {
    response.resume();
    throw new Error(`Target returned unsupported content type: ${type.split(';')[0]}.`);
  }
  const declared = Number(response.headers['content-length']);
  if (Number.isFinite(declared) && declared > MAX_HTML_BYTES) {
    response.resume();
    throw new Error(`Public page exceeds the ${MAX_HTML_BYTES} byte capture limit.`);
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of response) {
    total += chunk.length;
    if (total > MAX_HTML_BYTES) {
      response.destroy();
      throw new Error(`Public page exceeds the ${MAX_HTML_BYTES} byte capture limit.`);
    }
    chunks.push(chunk);
  }
  return { html: Buffer.concat(chunks).toString('utf8'), url: target.toString() };
}

export class PublicWebCollector {
  constructor() {
    this.kind = 'public-web';
    this.collectorId = 'webreceipt-public-web';
    this.lastTarget = null;
    this.lastHealthy = null;
    this.repairedTargets = new Set();
  }

  async collect({ url, mutation = 'healthy' } = {}) {
    const { html, url: finalUrl } = await readHtmlUrl(url);
    const healthy = parsePublicDealHtml(html, { url: finalUrl });
    this.lastTarget = finalUrl;
    this.lastHealthy = healthy;
    if (mutation === 'healthy' || this.repairedTargets.has(finalUrl)) return healthy;
    if (mutation !== 'wrong-valid-total') throw new Error(`Unknown public-web mutation: ${mutation}`);
    const broken = clone(healthy);
    broken.checkout.finalTotal = Math.max(0, Math.round(healthy.checkout.finalTotal * 80) / 100);
    broken.collectorVersion = 'webreceipt-public-web-v1-simulated-redesign';
    return broken;
  }

  async heal({ prompt } = {}) {
    if (!this.lastTarget || !this.lastHealthy) throw new Error('Public-web repair requires a failed observation in the same run.');
    return {
      status: 'awaiting_approval',
      approval: 'required',
      provider: 'webreceipt-public-web',
      prompt: String(prompt || '').slice(0, 1000),
      previewResult: [clone(this.lastHealthy)],
      diff: 'Restore the semantic final-total mapping after the simulated redesign.',
    };
  }

  async approveHeal() {
    if (!this.lastTarget) throw new Error('No public-web repair target is awaiting approval.');
    this.repairedTargets.add(this.lastTarget);
    return { status: 'done', approval: 'approved', autoSaved: false, provider: 'webreceipt-public-web' };
  }

  async rejectHeal() {
    return { status: 'done', approval: 'rejected', provider: 'webreceipt-public-web' };
  }
}
