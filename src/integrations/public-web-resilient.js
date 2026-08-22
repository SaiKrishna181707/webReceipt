import { PublicWebCollector as BasePublicWebCollector } from './public-web.js';

const SYMBOLS = new Map([
  ['₹', 'INR'], ['Rs', 'INR'], ['Rs.', 'INR'],
  ['$', 'USD'], ['US$', 'USD'],
  ['€', 'EUR'], ['£', 'GBP'], ['¥', 'JPY'],
  ['A$', 'AUD'], ['AU$', 'AUD'], ['C$', 'CAD'], ['CA$', 'CAD'], ['S$', 'SGD'], ['SG$', 'SGD'],
]);
const CODES = new Set(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD']);
const CURRENCY = '(?:INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD|US\\$|A\\$|AU\\$|C\\$|CA\\$|S\\$|SG\\$|Rs\\.?|₹|\\$|€|£|¥)';
const AMOUNT = '(?:[0-9]{1,3}(?:[ ,.]?[0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?)';
const PRICE_KEYS = ['finalPrice', 'currentPrice', 'salePrice', 'discountedPrice', 'lowPrice', 'price'];
const PRICE_HINT = /\b(?:total|price|sale|now|from|starting|deal|offer|pay)\b/i;

function decode(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;|\u00a0/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
}

function attrs(tag) {
  const out = {};
  for (const match of String(tag).matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    out[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
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
  const raw = decode(value).trim();
  const upper = raw.toUpperCase();
  if (CODES.has(upper)) return upper;
  if (/^RS\.?$/i.test(raw)) return 'INR';
  return SYMBOLS.get(raw) || null;
}

function priceFromText(value) {
  const text = decode(value).replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const before = new RegExp(`(${CURRENCY})\\s*(${AMOUNT})(?![0-9A-Za-z])`, 'i').exec(text);
  if (before) {
    const amount = numberFrom(before[2]);
    const currency = currencyFrom(before[1]);
    if (amount != null && currency) return { amount, currency };
  }

  const after = new RegExp(`(${AMOUNT})\\s*(${CURRENCY})(?![A-Za-z])`, 'i').exec(text);
  if (after) {
    const amount = numberFrom(after[1]);
    const currency = currencyFrom(after[2]);
    if (amount != null && currency) return { amount, currency };
  }
  return null;
}

function findMicrodata(html) {
  let amount = null;
  let currency = null;
  for (const tag of String(html).match(/<[^>]+>/g) || []) {
    const a = attrs(tag);
    const props = String(a.itemprop || '').toLowerCase().split(/\s+/);
    const rawPrice = props.includes('price')
      ? (a.content ?? a.value)
      : (a['data-price'] ?? a['data-product-price'] ?? a['data-sale-price']);
    const embedded = rawPrice != null ? priceFromText(rawPrice) : null;
    if (embedded) return embedded;
    if (amount == null && rawPrice != null) amount = numberFrom(rawPrice);
    if (!currency && (props.includes('pricecurrency') || a['data-currency'] != null || a['data-price-currency'] != null)) {
      currency = currencyFrom(a.content ?? a.value ?? a['data-currency'] ?? a['data-price-currency']);
    }
    if (amount != null && currency) return { amount, currency };
  }
  return null;
}

function currencyFromObject(node) {
  return currencyFrom(
    node?.priceCurrency ?? node?.currency ?? node?.currencyCode ?? node?.currency_code ?? node?.currencyIso ?? node?.currencyISO,
  );
}

function amountFromObject(value) {
  if (value == null) return null;
  if (typeof value === 'object') {
    const formatted = priceFromText(value.formatted ?? value.display ?? value.label ?? '');
    if (formatted) return formatted;
    const amount = numberFrom(value.amount ?? value.value ?? value.price);
    const currency = currencyFromObject(value);
    if (amount != null && currency) return { amount, currency };
    return null;
  }
  return priceFromText(value);
}

function findJsonPrice(root) {
  let result = null;
  const visit = (value) => {
    if (result || value == null) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value !== 'object') return;

    const ownCurrency = currencyFromObject(value);
    for (const key of PRICE_KEYS) {
      if (!(key in value)) continue;
      const nested = amountFromObject(value[key]);
      if (nested) { result = nested; return; }
      const amount = numberFrom(value[key]);
      if (amount != null && ownCurrency) { result = { amount, currency: ownCurrency }; return; }
    }

    for (const [key, child] of Object.entries(value)) {
      if (/formatted.*price|price.*formatted|display.*price/i.test(key)) {
        const formatted = priceFromText(child);
        if (formatted) { result = formatted; return; }
      }
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(root);
  return result;
}

function findEmbeddedJson(html) {
  for (const match of String(html).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = attrs(`<script ${match[1] || ''}>`);
    const body = decode(match[2]).trim();
    if (!body) continue;
    const type = String(attributes.type || '').toLowerCase();
    const isJson = type.includes('json') || attributes.id === '__NEXT_DATA__' || /^[\[{]/.test(body);
    if (isJson) {
      try {
        const found = findJsonPrice(JSON.parse(body));
        if (found) return found;
      } catch {
        // Many production pages contain JS objects rather than strict JSON; use the bounded regex fallback below.
      }
    }

    for (const key of PRICE_KEYS) {
      const keyPattern = new RegExp(`["']?${key}["']?\\s*:\\s*(["']?)([^,"'};]{1,80})\\1`, 'ig');
      for (const priceMatch of body.matchAll(keyPattern)) {
        const direct = priceFromText(priceMatch[2]);
        if (direct) return direct;
        const amount = numberFrom(priceMatch[2]);
        if (amount == null) continue;
        const start = Math.max(0, (priceMatch.index || 0) - 400);
        const context = body.slice(start, Math.min(body.length, (priceMatch.index || 0) + priceMatch[0].length + 400));
        const currencyMatch = /["']?(?:priceCurrency|currencyCode|currency_code|currency)["']?\s*:\s*["']([^"']{1,12})["']/i.exec(context);
        const currency = currencyFrom(currencyMatch?.[1]);
        if (currency) return { amount, currency };
      }
    }
  }
  return null;
}

function findVisiblePrice(html) {
  const text = decode(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;

  const chunks = text.split(/(?<=[.!?])\s+|\s*[|•·]\s*/).filter(Boolean);
  for (const chunk of chunks) {
    if (!PRICE_HINT.test(chunk)) continue;
    const found = priceFromText(chunk);
    if (found) return found;
  }
  return priceFromText(text);
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function enhancePublicCommerceHtml(html) {
  const value = String(html || '');
  const found = findMicrodata(value) || findEmbeddedJson(value) || findVisiblePrice(value);
  if (!found) return value;
  const injected = `<meta property="product:price:amount" content="${escapeAttr(found.amount)}"><meta property="product:price:currency" content="${escapeAttr(found.currency)}">`;
  return /<head\b[^>]*>/i.test(value)
    ? value.replace(/<head\b[^>]*>/i, (head) => `${head}${injected}`)
    : `${injected}${value}`;
}

function enhanceResponse(response) {
  return { ...response, html: enhancePublicCommerceHtml(response.html) };
}

export class PublicWebCollector extends BasePublicWebCollector {
  async requestHtml(rawUrl) {
    return enhanceResponse(await super.requestHtml(rawUrl));
  }

  async requestBrightDataHtml(rawUrl) {
    return enhanceResponse(await super.requestBrightDataHtml(rawUrl));
  }
}
