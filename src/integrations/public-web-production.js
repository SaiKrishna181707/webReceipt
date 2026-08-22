import { extractPublicPageObservation } from './public-web.js';
import {
  PublicWebCollector as ResilientPublicWebCollector,
  enhancePublicCommerceHtml,
} from './public-web-resilient.js';

const MAX_REDIRECTS = 5;
const UNLOCKER_ENDPOINT = 'https://api.brightdata.com/request';
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const CURRENCY_ALIASES = new Map([
  ['INR', 'INR'], ['RS', 'INR'], ['RS.', 'INR'], ['₹', 'INR'],
  ['USD', 'USD'], ['$', 'USD'],
  ['EUR', 'EUR'], ['€', 'EUR'],
  ['GBP', 'GBP'], ['£', 'GBP'],
  ['JPY', 'JPY'], ['¥', 'JPY'],
  ['AUD', 'AUD'], ['A$', 'AUD'], ['AU$', 'AUD'],
  ['CAD', 'CAD'], ['C$', 'CAD'], ['CA$', 'CAD'],
  ['SGD', 'SGD'], ['S$', 'SGD'], ['SG$', 'SGD'],
  ['AED', 'AED'], ['د.إ', 'AED'],
  ['KRW', 'KRW'], ['₩', 'KRW'],
  ['BRL', 'BRL'], ['R$', 'BRL'],
  ['HKD', 'HKD'], ['HK$', 'HKD'],
  ['NZD', 'NZD'], ['NZ$', 'NZD'],
  ['MXN', 'MXN'], ['MX$', 'MXN'],
  ['CHF', 'CHF'],
  ['SEK', 'SEK'], ['NOK', 'NOK'], ['DKK', 'DKK'],
  ['PLN', 'PLN'], ['ZŁ', 'PLN'],
  ['CZK', 'CZK'], ['KČ', 'CZK'],
  ['TRY', 'TRY'], ['₺', 'TRY'],
  ['RUB', 'RUB'], ['₽', 'RUB'],
  ['UAH', 'UAH'], ['₴', 'UAH'],
  ['THB', 'THB'], ['฿', 'THB'],
  ['PHP', 'PHP'], ['₱', 'PHP'],
  ['VND', 'VND'], ['₫', 'VND'],
  ['IDR', 'IDR'], ['RP', 'IDR'],
  ['MYR', 'MYR'], ['RM', 'MYR'],
  ['ZAR', 'ZAR'], ['SAR', 'SAR'], ['QAR', 'QAR'], ['KWD', 'KWD'], ['BHD', 'BHD'], ['OMR', 'OMR'],
]);

const CURRENCY_PATTERN = Array.from(CURRENCY_ALIASES.keys())
  .sort((a, b) => b.length - a.length)
  .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
const AMOUNT_PATTERN = String.raw`(?:[0-9]{1,3}(?:[\s,.'’][0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?)`;

function enabled(name) {
  return /^(1|true|yes)$/i.test(String(process.env[name] || '').trim());
}

function unlockerConfigured() {
  return Boolean(
    String(process.env.BRIGHT_DATA_API_TOKEN || '').trim()
    && String(process.env.BRIGHT_DATA_UNLOCKER_ZONE || '').trim()
    && enabled('WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE'),
  );
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

function numberFrom(value) {
  const raw = String(value ?? '').replace(/[^0-9.,-]/g, '').trim();
  if (!raw) return null;
  let normalized = raw;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) normalized = raw.replace(/,/g, '');
  else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) normalized = raw.replace(/\./g, '').replace(',', '.');
  else if (raw.includes(',') && !raw.includes('.')) {
    const tail = raw.split(',').at(-1) || '';
    normalized = tail.length === 3 ? raw.replace(/,/g, '') : raw.replace(',', '.');
  } else normalized = raw.replace(/,/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function currencyFrom(value) {
  const raw = normalizeSpace(value);
  if (!raw) return null;
  return CURRENCY_ALIASES.get(raw.toUpperCase()) || CURRENCY_ALIASES.get(raw) || null;
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function injectCanonicalPrice(html, price) {
  if (!price || price.amount == null || !price.currency) return String(html || '');
  const injected = `<meta property="product:price:amount" content="${escapeAttr(price.amount)}"><meta property="product:price:currency" content="${escapeAttr(price.currency)}">`;
  const value = String(html || '');
  return /<head\b[^>]*>/i.test(value)
    ? value.replace(/<head\b[^>]*>/i, (head) => `${head}${injected}`)
    : `${injected}${value}`;
}

function canExtract(html, sourceUrl) {
  try {
    extractPublicPageObservation(html, { sourceUrl, collectorVersion: 'public-web-production-probe' });
    return true;
  } catch (error) {
    if (/No commerce price with an identifiable currency/i.test(String(error?.message || error))) return false;
    throw error;
  }
}

function findMicrodataPrice(html) {
  let amount = null;
  let currency = null;
  for (const tag of String(html || '').match(/<[^>]+>/g) || []) {
    const attrs = parseAttributes(tag);
    const props = String(attrs.itemprop || '').toLowerCase().split(/\s+/);
    if (amount == null && (
      props.includes('price')
      || attrs['data-price'] != null
      || attrs['data-product-price'] != null
      || attrs['data-sale-price'] != null
    )) {
      amount = numberFrom(attrs.content ?? attrs.value ?? attrs['data-price'] ?? attrs['data-product-price'] ?? attrs['data-sale-price']);
    }
    if (!currency && (
      props.includes('pricecurrency')
      || attrs['data-currency'] != null
      || attrs['data-price-currency'] != null
    )) {
      currency = currencyFrom(attrs.content ?? attrs.value ?? attrs['data-currency'] ?? attrs['data-price-currency']);
    }
    if (amount != null && currency) return { amount, currency, score: 80, source: 'microdata' };
  }
  return null;
}

function walkJson(value, visit, budget = { remaining: 12000 }) {
  if (budget.remaining-- <= 0) return;
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, visit, budget);
    return;
  }
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const child of Object.values(value)) walkJson(child, visit, budget);
}

function candidatesFromNode(node) {
  const type = String(node?.['@type'] || node?.type || '').toLowerCase();
  const typedBoost = /product|offer|pricing|checkout|cart/.test(type) ? 8 : 0;
  const commonCurrency = node.priceCurrency ?? node.currency ?? node.currencyCode ?? node.currency_code;
  const specs = [
    ['finalTotal', 45], ['grandTotal', 44], ['orderTotal', 43], ['totalPrice', 42], ['payableAmount', 41],
    ['currentPrice', 36], ['salePrice', 35], ['offerPrice', 34], ['discountedPrice', 33], ['price', 30],
    ['lowPrice', 24], ['highPrice', 20], ['amount', 16], ['value', 10],
  ];
  const out = [];
  for (const [key, score] of specs) {
    const raw = node[key];
    if (raw == null) continue;
    if (raw && typeof raw === 'object') {
      const amount = numberFrom(raw.amount ?? raw.value ?? raw.price);
      const currency = currencyFrom(raw.currency ?? raw.currencyCode ?? raw.priceCurrency ?? commonCurrency);
      if (amount != null && currency) out.push({ amount, currency, score: score + typedBoost + 2, source: `embedded JSON ${key}` });
      continue;
    }
    const amount = numberFrom(raw);
    const currency = currencyFrom(commonCurrency);
    if (amount != null && currency) out.push({ amount, currency, score: score + typedBoost, source: `embedded JSON ${key}` });
  }
  const priceSpec = node.priceSpecification;
  if (priceSpec && typeof priceSpec === 'object') {
    const amount = numberFrom(priceSpec.price ?? priceSpec.amount ?? priceSpec.value);
    const currency = currencyFrom(priceSpec.priceCurrency ?? priceSpec.currency ?? commonCurrency);
    if (amount != null && currency) out.push({ amount, currency, score: 40 + typedBoost, source: 'embedded JSON priceSpecification' });
  }
  return out;
}

function findEmbeddedJsonPrice(html) {
  const candidates = [];
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of String(html || '').matchAll(scriptRegex)) {
    const attrs = parseAttributes(`<script ${match[1]}>`);
    const type = String(attrs.type || '').toLowerCase();
    const id = String(attrs.id || '').toLowerCase();
    const raw = String(match[2] || '').trim();
    if (!raw || raw.length > 750_000) continue;
    const jsonLike = /application\/(?:ld\+)?json/.test(type)
      || /next_data|nuxt_data|initial[_-]?state|dehydrated[_-]?state/.test(id)
      || /^[\[{]/.test(raw);
    if (!jsonLike) continue;
    try {
      const parsed = JSON.parse(raw);
      walkJson(parsed, (node) => candidates.push(...candidatesFromNode(node)));
    } catch {
      // Script-tag state is often JavaScript rather than strict JSON; ignore it.
    }
  }
  return candidates.sort((a, b) => b.score - a.score)[0] || null;
}

function visibleText(html) {
  return normalizeSpace(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' '));
}

function priceContextScore(context) {
  const text = String(context || '').toLowerCase();
  let score = 10;
  if (/grand\s*total|order\s*total|final\s*total|total\s*due|amount\s*due|payable|checkout\s*total/.test(text)) score += 35;
  else if (/\btotal\b/.test(text)) score += 18;
  if (/sale\s*price|current\s*price|deal\s*price|our\s*price|special\s*price|today|\bnow\b|pay\s*now/.test(text)) score += 16;
  if (/\bprice\b/.test(text)) score += 6;
  if (/\bwas\b|list\s*price|original\s*price|regular\s*price|\bmrp\b|strikethrough/.test(text)) score -= 22;
  if (/save\s|discount\s|coupon\s|promo\s/.test(text)) score -= 8;
  if (/shipping|delivery|tax(?:es)?|service\s*fee|booking\s*fee/.test(text) && !/\btotal\b/.test(text)) score -= 16;
  return score;
}

function findVisiblePrice(html) {
  const text = visibleText(html);
  if (!text) return null;
  const candidates = [];
  const patterns = [
    new RegExp(`(${CURRENCY_PATTERN})\\s*(${AMOUNT_PATTERN})`, 'gi'),
    new RegExp(`(${AMOUNT_PATTERN})\\s*(${CURRENCY_PATTERN})`, 'gi'),
  ];
  for (let p = 0; p < patterns.length; p++) {
    for (const match of text.matchAll(patterns[p])) {
      const currencyRaw = p === 0 ? match[1] : match[2];
      const amountRaw = p === 0 ? match[2] : match[1];
      const amount = numberFrom(amountRaw);
      const currency = currencyFrom(currencyRaw);
      if (amount == null || !currency) continue;
      const index = match.index || 0;
      const context = text.slice(Math.max(0, index - 90), Math.min(text.length, index + match[0].length + 90));
      candidates.push({ amount, currency, score: priceContextScore(context), source: normalizeSpace(match[0]), index });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  return candidates[0] || null;
}

export function enhanceProductionCommerceHtml(html, { sourceUrl } = {}) {
  const value = String(html || '');
  if (sourceUrl && canExtract(value, sourceUrl)) return value;

  const selected = findMicrodataPrice(value) || findEmbeddedJsonPrice(value) || findVisiblePrice(value);
  if (selected) return injectCanonicalPrice(value, selected);

  // Keep the prior hardening layer as a final compatibility fallback.
  return enhancePublicCommerceHtml(value);
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
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function shouldRetryWithUnlocker(error) {
  const message = String(error?.message || error);
  if (/timed out|fetch failed|redirect .*location|exceeded \d+ redirects/i.test(message)) return true;
  const status = Number(message.match(/Public page returned HTTP (\d{3})/i)?.[1]);
  return [401, 403, 408, 409, 425, 429, 451].includes(status) || status >= 500;
}

function boundedBody(value, maxBytes) {
  const body = String(value ?? '');
  if (Buffer.byteLength(body) > maxBytes) throw new Error(`Public page response exceeds ${maxBytes} bytes.`);
  return body;
}

export class PublicWebCollector extends ResilientPublicWebCollector {
  async requestDirectHtml(rawUrl) {
    let current = await this.resolveTarget(rawUrl);
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
      let response;
      try {
        response = await this.fetchImpl(current, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': BROWSER_USER_AGENT,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
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

  async requestUnlockedHtml(rawUrl) {
    const targetUrl = await this.resolveTarget(rawUrl);
    let response;
    try {
      response = await this.fetchImpl(UNLOCKER_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${String(process.env.BRIGHT_DATA_API_TOKEN || '').trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zone: String(process.env.BRIGHT_DATA_UNLOCKER_ZONE || '').trim(),
          url: targetUrl,
          format: 'raw',
          method: 'GET',
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (error?.name === 'TimeoutError' || /aborted|timeout/i.test(String(error?.message || error))) {
        throw new Error(`Bright Data Unlocker timed out after ${this.timeoutMs}ms.`);
      }
      throw new Error(`Bright Data Unlocker request failed: ${error?.message || error}`);
    }

    const raw = await readTextLimited(response, this.maxBytes);
    if (!response.ok) throw new Error(`Bright Data Unlocker failed: ${response.status} ${raw.slice(0, 500)}`);

    const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
    let html = raw;
    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') html = parsed;
        else if (parsed && typeof parsed.body === 'string') html = parsed.body;
        else if (parsed && typeof parsed.html === 'string') html = parsed.html;
        else if (parsed && typeof parsed.data === 'string') html = parsed.data;
      } catch {
        // If an upstream labels raw HTML as JSON, keep the raw response.
      }
    }
    return { html: boundedBody(html, this.maxBytes), sourceUrl: targetUrl, via: 'brightdata-unlocker' };
  }

  async requestHtml(rawUrl) {
    let direct;
    try {
      direct = await this.requestDirectHtml(rawUrl);
      const prepared = enhanceProductionCommerceHtml(direct.html, { sourceUrl: direct.sourceUrl });
      if (canExtract(prepared, direct.sourceUrl) || !unlockerConfigured()) {
        return { ...direct, html: prepared };
      }
    } catch (error) {
      if (!unlockerConfigured() || !shouldRetryWithUnlocker(error)) throw error;
    }

    // Web Unlocker is deliberately a fallback: static public HTML costs no
    // Bright Data credits, while blocked/JS-rendered pages can opt into the
    // configured production unblocking path.
    const unlocked = await this.requestUnlockedHtml(rawUrl);
    return {
      ...unlocked,
      html: enhanceProductionCommerceHtml(unlocked.html, { sourceUrl: unlocked.sourceUrl }),
    };
  }
}
