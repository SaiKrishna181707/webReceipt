import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { assertPublicTarget, isPrivateNetworkHost } from '../domain/target-policy.js';

const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;
const SUPPORTED_CURRENCIES = new Set(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD']);
const SYMBOL_CURRENCIES = new Map([['₹', 'INR'], ['$', 'USD'], ['€', 'EUR'], ['£', 'GBP'], ['¥', 'JPY']]);

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function enabled(name) {
  return /^(1|true|yes)$/i.test(String(process.env[name] || '').trim());
}

function publicWebError(message, status = 502, code = 'scraper_upstream') {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
}

function normalizeSpace(value) {
  return decodeEntities(value).replace(/\s+/g, ' ').trim();
}

function parseAttributes(tag) {
  const out = {};
  for (const match of String(tag).matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    out[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return out;
}

function metaMap(html) {
  const map = new Map();
  for (const tag of String(html).match(/<meta\b[^>]*>/gi) || []) {
    const attrs = parseAttributes(tag);
    const key = String(attrs.property || attrs.name || attrs.itemprop || '').toLowerCase();
    const content = normalizeSpace(attrs.content || attrs.value || '');
    if (key && content && !map.has(key)) map.set(key, content);
  }
  return map;
}

function readJsonLd(html) {
  const values = [];
  for (const match of String(html).matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = match[1].trim();
    if (!raw) continue;
    try { values.push(JSON.parse(raw)); } catch { /* malformed JSON-LD is ignored */ }
  }
  return values;
}

function walk(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const child of Object.values(value)) walk(child, visit);
}

function hasSchemaType(node, expected) {
  const type = node?.['@type'];
  const values = Array.isArray(type) ? type : [type];
  return values.some((value) => String(value || '').toLowerCase() === expected);
}

function numberFrom(value) {
  const raw = String(value ?? '').replace(/[^0-9.,-]/g, '').trim();
  if (!raw) return null;
  let normalized = raw;
  if (raw.includes(',') && !raw.includes('.')) {
    const parts = raw.split(',');
    normalized = parts.length > 2 || parts.at(-1)?.length === 3 ? parts.join('') : raw.replace(',', '.');
  } else if (raw.includes('.') && !raw.includes(',')) {
    const parts = raw.split('.');
    if (parts.length > 2) normalized = parts.join('');
  } else if (raw.includes(',') && raw.includes('.')) {
    normalized = raw.lastIndexOf('.') > raw.lastIndexOf(',') ? raw.replace(/,/g, '') : raw.replace(/\./g, '').replace(',', '.');
  }
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function currencyFrom(value) {
  const raw = normalizeSpace(value).toUpperCase();
  if (SUPPORTED_CURRENCIES.has(raw)) return raw;
  return SYMBOL_CURRENCIES.get(String(value || '').trim()) || null;
}

function htmlToVisibleText(html) {
  return normalizeSpace(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<\/(?:p|div|li|section|article|h[1-6]|tr)>/gi, '. ')
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<[^>]+>/g, ' '));
}

function commerceFromJsonLd(jsonLd) {
  const candidates = [];
  let productName = '';
  for (const root of jsonLd) {
    walk(root, (node) => {
      if (!productName && (hasSchemaType(node, 'product') || hasSchemaType(node, 'hotel') || hasSchemaType(node, 'service'))) {
        productName = normalizeSpace(node.name || '');
      }
      if (!hasSchemaType(node, 'offer') && !hasSchemaType(node, 'aggregateoffer')) return;
      const spec = node.priceSpecification && typeof node.priceSpecification === 'object' ? node.priceSpecification : {};
      const amount = numberFrom(node.price ?? node.lowPrice ?? node.highPrice ?? spec.price);
      const currency = currencyFrom(node.priceCurrency ?? spec.priceCurrency);
      if (amount != null && currency) candidates.push({ amount, currency, captured: `${currency} ${amount}`, source: 'JSON-LD Offer', score: 100 });
    });
  }
  return { candidate: candidates[0] || null, productName };
}

function commerceFromMeta(meta) {
  const amountRaw = meta.get('product:price:amount') || meta.get('og:price:amount') || meta.get('price');
  const currencyRaw = meta.get('product:price:currency') || meta.get('og:price:currency') || meta.get('pricecurrency');
  const amount = numberFrom(amountRaw);
  const currency = currencyFrom(currencyRaw);
  if (amount == null || !currency) return null;
  return { amount, currency, captured: `${currency} ${amount}`, source: 'page metadata', score: 90 };
}

function priceCandidates(text, baseScore = 50) {
  const candidates = [];
  const patterns = [
    /([₹$€£¥])\s*([0-9][0-9.,]*)(?![\w])/g,
    /\b(INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD)\s*([0-9][0-9.,]*)\b/gi,
    /\b([0-9][0-9.,]*)\s*(INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD)\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of String(text).matchAll(pattern)) {
      const symbolFirst = SYMBOL_CURRENCIES.has(match[1]);
      const currency = currencyFrom(symbolFirst ? match[1] : (/[A-Za-z]/.test(match[1]) ? match[1] : match[2]));
      const amount = numberFrom(symbolFirst ? match[2] : (/[A-Za-z]/.test(match[1]) ? match[2] : match[1]));
      if (amount == null || !currency) continue;
      const index = match.index || 0;
      const context = String(text).slice(Math.max(0, index - 90), index + match[0].length + 90).toLowerCase();
      let score = baseScore;
      if (/\b(final|total|price|pay|deal|offer|sale|now|from)\b/.test(context)) score += 18;
      if (/\b(was|list price|mrp|shipping|delivery|tax|fee|per month|\/month)\b/.test(context)) score -= 8;
      candidates.push({ amount, currency, captured: normalizeSpace(match[0]), source: 'public page text', score });
    }
  }
  return candidates;
}

function bestPrice(html, visible, meta, jsonLd) {
  const structured = commerceFromJsonLd(jsonLd);
  const candidates = [];
  if (structured.candidate) candidates.push(structured.candidate);
  const metadata = commerceFromMeta(meta);
  if (metadata) candidates.push(metadata);
  candidates.push(...priceCandidates(visible, 55));
  if (!candidates.length) {
    const rawText = normalizeSpace(String(html).replace(/<[^>]+>/g, ' '));
    candidates.push(...priceCandidates(rawText, 30));
  }
  candidates.sort((a, b) => b.score - a.score);
  return { candidate: candidates[0] || null, productName: structured.productName };
}

function extractSentence(text, keywords, fallback) {
  const parts = String(text).split(/(?<=[.!?])\s+|\s*[|•·]\s*/).map(normalizeSpace).filter(Boolean);
  const found = parts.find((part) => part.length <= 360 && keywords.some((keyword) => part.toLowerCase().includes(keyword)));
  return found || fallback;
}

function evidence(id, field, sourceUrl, capturedText, journeyStep, collectorVersion, observedAt) {
  return {
    id,
    field,
    sourceUrl,
    capturedText: normalizeSpace(capturedText).slice(0, 600),
    screenshotRef: null,
    domPath: null,
    journeyStep,
    observedAt,
    collectorVersion,
  };
}

function mutationKey(targetUrl, mutation) {
  return `${assertPublicTarget(targetUrl)}|${mutation}`;
}

function mutateObservation(observation, mutation) {
  if (!mutation || mutation === 'healthy') return observation;
  if (mutation !== 'wrong-valid-total') throw publicWebError(`Unknown public-web mutation: ${mutation}`, 400, 'invalid_mutation');
  const expected = observation.checkout.basePrice + observation.checkout.mandatoryFees + observation.checkout.taxes + observation.checkout.optionalAddons - observation.checkout.discounts;
  const drift = Math.max(1, Math.round(Math.max(expected, 1) * 0.07 * 100) / 100);
  const broken = Math.round((expected + drift) * 100) / 100;
  return {
    ...observation,
    collectorVersion: `${observation.collectorVersion}-broken-${mutation}`,
    checkout: { ...observation.checkout, finalTotal: broken },
    journey: observation.journey.map((step, index) => index === observation.journey.length - 1 ? { ...step, displayedPrice: broken } : step),
    evidence: observation.evidence.map((item) => item.field === 'checkout.finalTotal'
      ? { ...item, capturedText: `Simulated extraction drift selected ${observation.currency} ${broken} instead of ${observation.currency} ${expected}.` }
      : item),
  };
}

export function extractPublicPageObservation(html, { sourceUrl, collectorVersion = 'public-web-direct-v2' } = {}) {
  const url = assertPublicTarget(sourceUrl);
  const meta = metaMap(html);
  const jsonLd = readJsonLd(html);
  const visible = htmlToVisibleText(html);
  const selected = bestPrice(html, visible, meta, jsonLd);
  if (!selected.candidate) {
    throw publicWebError('No commerce price with an identifiable currency could be extracted from this public page.', 422, 'scraper_no_price');
  }

  const titleTag = String(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  const h1 = String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
  const subject = normalizeSpace(selected.productName || meta.get('og:title') || h1.replace(/<[^>]+>/g, ' ') || titleTag.replace(/<[^>]+>/g, ' ') || new URL(url).hostname).slice(0, 240);
  const cancellation = extractSentence(visible, ['cancellation', 'cancel', 'return policy', 'returns'], 'Not stated on the observed public page.');
  const refundability = extractSentence(visible, ['refund', 'refundable', 'non-refundable', 'return policy', 'returns'], 'Not stated on the observed public page.');
  const paymentTiming = extractSentence(visible, ['pay now', 'payment', 'charged', 'billing'], 'Not stated on the observed public page.');
  const claims = ['free cancellation', 'free shipping', 'free returns', 'best price guarantee', 'no booking fees'].filter((claim) => visible.toLowerCase().includes(claim));
  const observedAt = new Date().toISOString();
  const { amount, currency, captured, source } = selected.candidate;
  const priceCapture = captured || `${source || 'public page'}: ${currency} ${amount}`;
  const cancellationCapture = cancellation.startsWith('Not stated')
    ? 'Parser note: no explicit cancellation or return-policy text was found in the fetched public HTML.'
    : cancellation;

  return {
    subject,
    targetUrl: url,
    observedAt,
    locale: String(meta.get('og:locale') || 'en'),
    currency,
    collectorId: 'public_web',
    collectorVersion,
    worker: 'safe-server-fetch',
    offer: { advertisedPrice: amount, claims },
    checkout: {
      basePrice: amount,
      feeItems: [],
      mandatoryFees: 0,
      taxes: 0,
      optionalAddons: 0,
      discounts: 0,
      finalTotal: amount,
    },
    terms: { cancellation, refundability, paymentTiming, inclusions: [] },
    journey: [
      { label: 'Public offer snapshot', url, displayedPrice: amount, evidenceId: 'ev_offer' },
      { label: 'Verified price snapshot', url, displayedPrice: amount, evidenceId: 'ev_total' },
    ],
    evidence: [
      evidence('ev_offer', 'offer.advertisedPrice', url, priceCapture, 1, collectorVersion, observedAt),
      evidence('ev_base', 'checkout.basePrice', url, priceCapture, 2, collectorVersion, observedAt),
      evidence('ev_total', 'checkout.finalTotal', url, priceCapture, 2, collectorVersion, observedAt),
      evidence('ev_cancel', 'terms.cancellation', url, cancellationCapture, 2, collectorVersion, observedAt),
    ],
  };
}

function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) {
      callback(publicWebError(`Target hostname could not be resolved: ${error.message}`, 400, 'invalid_target'));
      return;
    }
    if (!Array.isArray(addresses) || !addresses.length) {
      callback(publicWebError('Target hostname did not resolve to a public address.', 400, 'invalid_target'));
      return;
    }
    if (addresses.some((entry) => isPrivateNetworkHost(entry.address))) {
      callback(publicWebError('Target hostname resolves to a private or reserved network address.', 400, 'invalid_target'));
      return;
    }
    const requestedFamily = typeof options === 'number' ? options : Number(options?.family || 0);
    const usable = requestedFamily ? addresses.filter((entry) => entry.family === requestedFamily) : addresses;
    if (!usable.length) {
      callback(publicWebError('Target hostname did not resolve to a usable public address.', 400, 'invalid_target'));
      return;
    }
    if (options && typeof options === 'object' && options.all) callback(null, usable);
    else callback(null, usable[0].address, usable[0].family);
  });
}

async function requestPublicOnce(rawUrl, { timeoutMs, maxBytes }) {
  const url = new URL(assertPublicTarget(rawUrl));
  const transport = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method: 'GET',
      lookup: safeLookup,
      agent: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebReceiptBot/2.0; +https://github.com/SaiKrishna181707/webReceipt)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        'Accept-Language': 'en-US,en;q=0.8',
        'Accept-Encoding': 'identity',
        Connection: 'close',
      },
    }, (response) => {
      const status = Number(response.statusCode || 0);
      const location = response.headers.location;
      if ([301, 302, 303, 307, 308].includes(status)) {
        response.resume();
        resolve({ status, location, headers: response.headers, body: null });
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(publicWebError(`Public page returned HTTP ${status}.`, 502, 'scraper_upstream'));
        return;
      }
      const declared = Number(response.headers['content-length']);
      if (Number.isFinite(declared) && declared > maxBytes) {
        response.destroy();
        reject(publicWebError(`Public page response exceeds ${maxBytes} bytes.`, 413, 'scraper_response_too_large'));
        return;
      }
      const encoding = String(response.headers['content-encoding'] || 'identity').toLowerCase();
      if (encoding && encoding !== 'identity') {
        response.destroy();
        reject(publicWebError(`Public page returned unsupported content encoding: ${encoding}.`, 422, 'scraper_unsupported_content'));
        return;
      }
      const chunks = [];
      let total = 0;
      response.on('data', (chunk) => {
        total += chunk.length;
        if (total > maxBytes) {
          response.destroy(publicWebError(`Public page response exceeds ${maxBytes} bytes.`, 413, 'scraper_response_too_large'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({ status, location: null, headers: response.headers, body: Buffer.concat(chunks).toString('utf8') }));
      response.on('error', reject);
    });
    request.setTimeout(timeoutMs, () => request.destroy(publicWebError(`Public page fetch timed out after ${timeoutMs}ms.`, 504, 'scraper_timeout')));
    request.on('error', (error) => reject(error?.status ? error : publicWebError(`Public page fetch failed: ${error?.message || error}`, 502, 'scraper_upstream')));
    request.end();
  });
}

async function readFetchTextLimited(response, maxBytes) {
  const declared = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) throw publicWebError(`Bright Data response exceeds ${maxBytes} bytes.`, 413, 'scraper_response_too_large');
  if (!response.body?.getReader) {
    const text = await response.text();
    if (Buffer.byteLength(text) > maxBytes) throw publicWebError(`Bright Data response exceeds ${maxBytes} bytes.`, 413, 'scraper_response_too_large');
    return text;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw publicWebError(`Bright Data response exceeds ${maxBytes} bytes.`, 413, 'scraper_response_too_large');
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}

function unlockerConfigured() {
  return Boolean(
    String(process.env.BRIGHT_DATA_API_TOKEN || '').trim()
    && String(process.env.BRIGHT_DATA_UNLOCKER_ZONE || '').trim()
    && enabled('WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE'),
  );
}

async function fetchWithBrightData(targetUrl, { timeoutMs, maxBytes, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${String(process.env.BRIGHT_DATA_API_TOKEN || '').trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone: String(process.env.BRIGHT_DATA_UNLOCKER_ZONE || '').trim(),
        url: targetUrl,
        format: 'raw',
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || /aborted|timeout/i.test(String(error?.message || error))) {
      throw publicWebError(`Bright Data Unlocker timed out after ${timeoutMs}ms.`, 504, 'scraper_timeout');
    }
    throw publicWebError(`Bright Data Unlocker request failed: ${error?.message || error}`, 502, 'scraper_upstream');
  }
  const text = await readFetchTextLimited(response, maxBytes);
  if (!response.ok) throw publicWebError(`Bright Data Unlocker returned HTTP ${response.status}: ${text.slice(0, 300)}`, 502, 'scraper_upstream');
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.body === 'string') return parsed.body;
      if (typeof parsed === 'string') return parsed;
    } catch { /* raw HTML can be returned with an imprecise content type */ }
  }
  return text;
}

export async function fetchPublicHtml(rawUrl, {
  timeoutMs = envNumber('PUBLIC_WEB_TIMEOUT_MS', DEFAULT_TIMEOUT_MS),
  maxBytes = envNumber('PUBLIC_WEB_MAX_BYTES', DEFAULT_MAX_BYTES),
  fetchImpl = fetch,
} = {}) {
  let current = assertPublicTarget(rawUrl);
  if (current.length > 4096) throw publicWebError('Target URL is too long.', 400, 'invalid_target');

  if (unlockerConfigured()) {
    const html = await fetchWithBrightData(current, { timeoutMs, maxBytes, fetchImpl });
    return { html, sourceUrl: current, via: 'brightdata-unlocker' };
  }

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const response = await requestPublicOnce(current, { timeoutMs, maxBytes });
    if (response.location) {
      if (redirects === MAX_REDIRECTS) throw publicWebError(`Public page exceeded ${MAX_REDIRECTS} redirects.`, 502, 'scraper_upstream');
      current = assertPublicTarget(new URL(response.location, current).toString());
      continue;
    }
    const html = response.body || '';
    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !/^\s*</.test(html)) {
      throw publicWebError(`Public page returned unsupported content type: ${contentType}.`, 422, 'scraper_unsupported_content');
    }
    return { html, sourceUrl: current, via: 'direct' };
  }
  throw publicWebError(`Public page exceeded ${MAX_REDIRECTS} redirects.`, 502, 'scraper_upstream');
}

export class PublicWebCollector {
  constructor({ fetchPage = fetchPublicHtml } = {}) {
    this.kind = 'public-web';
    this.fetchPage = fetchPage;
    this.healed = new Set();
  }

  inject(mutation, targetUrl) {
    if (!mutation || mutation === 'healthy' || !targetUrl) return;
    this.healed.delete(mutationKey(targetUrl, mutation));
  }

  async collect({ url, mutation = 'healthy' } = {}) {
    if (!url) throw publicWebError('Public web collection requires a URL input.', 400, 'invalid_target');
    const targetUrl = assertPublicTarget(url);
    const response = await this.fetchPage(targetUrl);
    const observation = extractPublicPageObservation(response.html, {
      sourceUrl: response.sourceUrl || targetUrl,
      collectorVersion: response.via === 'brightdata-unlocker' ? 'public-web-brightdata-v2' : 'public-web-direct-v2',
    });
    if (mutation !== 'healthy' && !this.healed.has(mutationKey(targetUrl, mutation))) return mutateObservation(observation, mutation);
    return observation;
  }

  async heal({ mutation, prompt, targetUrl } = {}) {
    if (!mutation || mutation === 'healthy') throw publicWebError('Public-web heal requires a broken mutation identity.', 400, 'invalid_mutation');
    if (!targetUrl) throw publicWebError('Public-web heal requires a target URL.', 400, 'invalid_target');
    const preview = await this.collect({ url: targetUrl, mutation: 'healthy' });
    return {
      status: 'awaiting_approval',
      approval: 'required',
      mutation,
      prompt,
      previewResult: [preview],
      diff: { strategy: 'fresh-public-page-reparse', collector: preview.collectorVersion },
    };
  }

  async respondToHeal({ approve, mutation, targetUrl } = {}) {
    if (!mutation || !targetUrl) throw publicWebError('Public-web heal response requires mutation and target URL.', 400, 'invalid_mutation');
    const key = mutationKey(targetUrl, mutation);
    if (approve) this.healed.add(key); else this.healed.delete(key);
    return { status: 'done', approval: approve ? 'approved' : 'rejected', mutation, targetUrl: assertPublicTarget(targetUrl) };
  }

  async approveHeal(args = {}) { return this.respondToHeal({ ...args, approve: true }); }
  async rejectHeal(args = {}) { return this.respondToHeal({ ...args, approve: false }); }
  reset() { this.healed.clear(); }
}
