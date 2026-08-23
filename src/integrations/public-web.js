import { assertPublicNetworkTarget, assertPublicTarget } from '../domain/target-policy.js';
import { SUPPORTED_CURRENCY_CODES, decodeHtmlEntities } from './html-text.js';

const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;
// Deliberately narrower than SUPPORTED_CURRENCY_CODES: this base layer only
// recognises unambiguous single-character symbols. The resilient layer adds the
// ambiguous ones (Rs, US$, A$ ...) along with the disambiguation to justify them.
const SYMBOL_CURRENCIES = new Map([['₹', 'INR'], ['$', 'USD'], ['€', 'EUR'], ['£', 'GBP'], ['¥', 'JPY']]);

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function enabled(name) {
  return /^(1|true|yes)$/i.test(String(process.env[name] || '').trim());
}

function normalizeSpace(value) {
  return decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
}

function htmlToText(html) {
  return normalizeSpace(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<\/(?:p|div|li|section|article|h[1-6]|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' '));
}

function parseAttributes(tag) {
  const out = {};
  for (const match of String(tag).matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    out[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return out;
}

function metaMap(html) {
  const map = new Map();
  for (const tag of String(html).match(/<meta\b[^>]*>/gi) || []) {
    const attrs = parseAttributes(tag);
    const key = String(attrs.property || attrs.name || attrs.itemprop || '').toLowerCase();
    const content = normalizeSpace(attrs.content || '');
    if (key && content && !map.has(key)) map.set(key, content);
  }
  return map;
}

function readJsonLd(html) {
  const values = [];
  for (const match of String(html).matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = decodeHtmlEntities(match[1]).trim();
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

function typeIncludes(node, name) {
  const type = node?.['@type'];
  return Array.isArray(type) ? type.some((item) => String(item).toLowerCase() === name) : String(type || '').toLowerCase() === name;
}

function numberFrom(value) {
  const raw = String(value ?? '').replace(/[^0-9.,-]/g, '').trim();
  if (!raw) return null;
  let normalized = raw;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) normalized = raw.replace(/,/g, '');
  else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) normalized = raw.replace(/\./g, '').replace(',', '.');
  else if (raw.includes(',') && !raw.includes('.')) normalized = raw.replace(',', '.');
  else normalized = raw.replace(/,/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function currencyFrom(value) {
  const raw = normalizeSpace(value).toUpperCase();
  if (SUPPORTED_CURRENCY_CODES.has(raw)) return raw;
  return SYMBOL_CURRENCIES.get(String(value || '').trim()) || null;
}

function jsonLdCommerce(jsonLd) {
  let productName = '';
  const offers = [];
  for (const root of jsonLd) {
    walk(root, (node) => {
      if (typeIncludes(node, 'product') && !productName) productName = normalizeSpace(node.name || '');
      if (typeIncludes(node, 'offer') || typeIncludes(node, 'aggregateoffer')) offers.push(node);
    });
  }
  for (const offer of offers) {
    const spec = offer.priceSpecification && typeof offer.priceSpecification === 'object' ? offer.priceSpecification : {};
    const amount = numberFrom(offer.price ?? offer.lowPrice ?? offer.highPrice ?? spec.price);
    const currency = currencyFrom(offer.priceCurrency ?? spec.priceCurrency);
    if (amount != null && currency) return { amount, currency, productName, source: 'JSON-LD Offer' };
  }
  return { amount: null, currency: null, productName, source: '' };
}

function textPrice(text) {
  const symbolMatch = text.match(/([₹$€£¥])\s*([0-9][0-9,]*(?:\.\d{1,2})?)/);
  if (symbolMatch) {
    const amount = numberFrom(symbolMatch[2]);
    const currency = currencyFrom(symbolMatch[1]);
    if (amount != null && currency) return { amount, currency, captured: symbolMatch[0] };
  }
  const codeMatch = text.match(/\b(INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i);
  if (codeMatch) {
    const amount = numberFrom(codeMatch[2]);
    const currency = currencyFrom(codeMatch[1]);
    if (amount != null && currency) return { amount, currency, captured: codeMatch[0] };
  }
  return null;
}

function metaCommerce(meta) {
  const amount = numberFrom(meta.get('product:price:amount') || meta.get('og:price:amount') || meta.get('price'));
  const currency = currencyFrom(meta.get('product:price:currency') || meta.get('og:price:currency') || meta.get('pricecurrency'));
  if (amount != null && currency) return { amount, currency, source: 'page metadata' };
  return null;
}

function extractSentence(text, keywords, fallback) {
  const parts = String(text).split(/(?<=[.!?])\s+|\s*[|•·]\s*/).map(normalizeSpace).filter(Boolean);
  const found = parts.find((part) => keywords.some((keyword) => part.toLowerCase().includes(keyword)) && part.length <= 300);
  return found || fallback;
}

function evidence(id, field, sourceUrl, capturedText, journeyStep, collectorVersion) {
  return { id, field, sourceUrl, capturedText, screenshotRef: null, domPath: null, journeyStep, observedAt: new Date().toISOString(), collectorVersion };
}

function mutateObservation(observation, mutation) {
  if (!mutation || mutation === 'healthy') return observation;
  if (mutation !== 'wrong-valid-total') throw new Error(`Unknown public-web mutation: ${mutation}`);
  const drift = Math.max(1, Math.round(Math.max(observation.checkout.basePrice, 1) * 0.07 * 100) / 100);
  const expected = observation.checkout.basePrice + observation.checkout.mandatoryFees + observation.checkout.taxes + observation.checkout.optionalAddons - observation.checkout.discounts;
  const broken = expected + drift;
  return {
    ...observation,
    collectorVersion: `${observation.collectorVersion}-broken-${mutation}`,
    checkout: { ...observation.checkout, finalTotal: broken },
    journey: observation.journey.map((step, index) => index === observation.journey.length - 1 ? { ...step, displayedPrice: broken } : step),
    evidence: observation.evidence.map((item) => item.field === 'checkout.finalTotal'
      ? { ...item, capturedText: `Simulated extraction drift: selected ${broken} instead of the verified page total.` }
      : item),
  };
}

export function extractPublicPageObservation(html, { sourceUrl, collectorVersion = 'public-web-v1' } = {}) {
  const url = assertPublicTarget(sourceUrl);
  const meta = metaMap(html);
  const jsonLd = readJsonLd(html);
  const visible = htmlToText(html);
  const structured = jsonLdCommerce(jsonLd);
  const metadata = metaCommerce(meta);
  const visiblePrice = textPrice(visible);
  const selected = structured.amount != null ? structured : metadata || visiblePrice;
  if (!selected || selected.amount == null || !selected.currency) {
    throw new Error('No commerce price with an identifiable currency could be extracted from this public page.');
  }

  const titleTag = String(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  const h1 = String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
  const subject = normalizeSpace(structured.productName || meta.get('og:title') || h1.replace(/<[^>]+>/g, ' ') || titleTag.replace(/<[^>]+>/g, ' ') || new URL(url).hostname);
  const cancellation = extractSentence(visible, ['cancellation', 'cancel', 'return policy', 'returns'], 'Not stated on the observed public page.');
  const refundability = extractSentence(visible, ['refund', 'refundable', 'non-refundable', 'return policy', 'returns'], 'Not stated on the observed public page.');
  const paymentTiming = extractSentence(visible, ['pay now', 'payment', 'charged', 'billing'], 'Not stated on the observed public page.');
  const observedAt = new Date().toISOString();
  const amount = selected.amount;
  const priceCapture = selected.captured || `${selected.source || 'public page'}: ${selected.currency} ${amount}`;
  const cancellationCapture = cancellation.startsWith('Not stated')
    ? 'Parser note: no explicit cancellation/return policy text was found in the fetched public HTML.'
    : cancellation;

  const provenance = [
    evidence('ev_offer', 'offer.advertisedPrice', url, priceCapture, 1, collectorVersion),
    evidence('ev_base', 'checkout.basePrice', url, priceCapture, 2, collectorVersion),
    evidence('ev_total', 'checkout.finalTotal', url, priceCapture, 2, collectorVersion),
    evidence('ev_cancel', 'terms.cancellation', url, cancellationCapture, 2, collectorVersion),
  ].map((item) => ({ ...item, observedAt }));

  return {
    subject,
    targetUrl: url,
    observedAt,
    locale: 'en',
    currency: selected.currency,
    collectorId: 'public_web',
    collectorVersion,
    worker: 'server-fetch',
    offer: { advertisedPrice: amount, claims: [] },
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
      { label: 'Advertised price', url, displayedPrice: amount, evidenceId: 'ev_offer' },
      { label: 'Observed page total', url, displayedPrice: amount, evidenceId: 'ev_total' },
    ],
    evidence: provenance,
  };
}

async function readTextLimited(response, maxBytes) {
  const declared = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error(`Public page response exceeds ${maxBytes} bytes.`);
  if (!response.body?.getReader) {
    const text = await response.text();
    if (Buffer.byteLength(text) > maxBytes) throw new Error(`Public page response exceeds ${maxBytes} bytes.`);
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
      throw new Error(`Public page response exceeds ${maxBytes} bytes.`);
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}

function brightDataUnlockerConfigured() {
  return Boolean(String(process.env.BRIGHT_DATA_API_TOKEN || '').trim() && String(process.env.BRIGHT_DATA_UNLOCKER_ZONE || '').trim() && enabled('WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE'));
}

export class PublicWebCollector {
  constructor({
    fetchImpl = fetch,
    resolveTarget = assertPublicNetworkTarget,
    maxBytes = envNumber('PUBLIC_WEB_MAX_BYTES', DEFAULT_MAX_BYTES),
    timeoutMs = envNumber('PUBLIC_WEB_TIMEOUT_MS', DEFAULT_TIMEOUT_MS),
  } = {}) {
    this.kind = 'public-web';
    this.fetchImpl = fetchImpl;
    this.resolveTarget = resolveTarget;
    this.maxBytes = maxBytes;
    this.timeoutMs = timeoutMs;
    this.healed = new Set();
    this.lastTargetUrl = null;
  }

  async requestHtml(rawUrl) {
    if (brightDataUnlockerConfigured()) {
      const targetUrl = await this.resolveTarget(rawUrl);
      let response;
      try {
        response = await this.fetchImpl('https://api.brightdata.com/request', {
          method: 'POST',
          headers: { Authorization: `Bearer ${String(process.env.BRIGHT_DATA_API_TOKEN).trim()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ zone: String(process.env.BRIGHT_DATA_UNLOCKER_ZONE).trim(), url: targetUrl, format: 'raw', method: 'GET' }),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (error) {
        if (error?.name === 'TimeoutError' || /aborted|timeout/i.test(String(error?.message || error))) {
          throw new Error(`Bright Data Unlocker timed out after ${this.timeoutMs}ms.`);
        }
        throw new Error(`Bright Data Unlocker request failed: ${error?.message || error}`);
      }
      if (!response.ok) throw new Error(`Bright Data Unlocker failed: ${response.status} ${(await response.text()).slice(0, 500)}`);
      const contentType = response.headers?.get?.('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await response.json();
        if (body && typeof body === 'object' && typeof body.body === 'string') return { html: body.body, sourceUrl: targetUrl, via: 'brightdata-unlocker' };
        if (typeof body === 'string') return { html: body, sourceUrl: targetUrl, via: 'brightdata-unlocker' };
      }
      return { html: await readTextLimited(response, this.maxBytes), sourceUrl: targetUrl, via: 'brightdata-unlocker' };
    }

    let current = await this.resolveTarget(rawUrl);
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
      let response;
      try {
        response = await this.fetchImpl(current, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WebReceiptBot/2.0; +https://github.com/SaiKrishna181707/webReceipt)',
            Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
            'Accept-Language': 'en-US,en;q=0.8',
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (error) {
        if (error?.name === 'TimeoutError' || /aborted|timeout/i.test(String(error?.message || error))) {
          throw new Error(`Public page fetch timed out after ${this.timeoutMs}ms.`);
        }
        throw new Error(`Public page fetch failed: ${error?.message || error}`);
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw new Error(`Public page redirect ${response.status} did not include a location.`);
        current = await this.resolveTarget(new URL(location, current).toString());
        continue;
      }
      if (!response.ok) throw new Error(`Public page returned HTTP ${response.status}.`);
      const contentType = String(response.headers.get('content-type') || '').toLowerCase();
      const html = await readTextLimited(response, this.maxBytes);
      if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !/^\s*</.test(html)) {
        throw new Error(`Public page returned unsupported content type: ${contentType}.`);
      }
      return { html, sourceUrl: current, via: 'direct' };
    }
    throw new Error(`Public page exceeded ${MAX_REDIRECTS} redirects.`);
  }

  async collect({ url, mutation = 'healthy' } = {}) {
    if (!url) throw new Error('Public web collection requires a URL input.');
    this.lastTargetUrl = assertPublicTarget(url);
    const response = await this.requestHtml(this.lastTargetUrl);
    const observation = extractPublicPageObservation(response.html, {
      sourceUrl: response.sourceUrl,
      collectorVersion: response.via === 'brightdata-unlocker' ? 'public-web-brightdata-v1' : 'public-web-direct-v1',
    });
    if (mutation !== 'healthy' && !this.healed.has(mutation)) return mutateObservation(observation, mutation);
    return observation;
  }

  async heal({ mutation, prompt } = {}) {
    if (!mutation || mutation === 'healthy') throw new Error('Public-web heal requires a broken mutation identity.');
    if (!this.lastTargetUrl) throw new Error('Public-web heal requires a prior observation target.');
    const preview = await this.collect({ url: this.lastTargetUrl, mutation: 'healthy' });
    return {
      status: 'awaiting_approval', approval: 'required', mutation, prompt,
      previewResult: [preview],
      diff: { strategy: 're-parse-public-page', collector: preview.collectorVersion },
    };
  }

  async respondToHeal({ approve, mutation } = {}) {
    if (!mutation) throw new Error('Public-web heal response requires the mutation identity.');
    if (approve) this.healed.add(mutation); else this.healed.delete(mutation);
    return { status: 'done', approval: approve ? 'approved' : 'rejected', mutation };
  }

  async approveHeal({ mutation } = {}) { return this.respondToHeal({ approve: true, mutation }); }
  async rejectHeal({ mutation } = {}) { return this.respondToHeal({ approve: false, mutation }); }
  reset() { this.healed.clear(); this.lastTargetUrl = null; }
}
