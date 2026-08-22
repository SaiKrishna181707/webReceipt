import { PublicWebCollector as BasePublicWebCollector } from './public-web.js';

const SYMBOLS = new Map([
  ['₹', 'INR'], ['$', 'USD'], ['€', 'EUR'], ['£', 'GBP'], ['¥', 'JPY'],
  ['A$', 'AUD'], ['AU$', 'AUD'], ['C$', 'CAD'], ['CA$', 'CAD'], ['S$', 'SGD'], ['SG$', 'SGD'],
]);
const CODES = new Set(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD']);
const CURRENCY = '(?:INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD|A\\$|AU\\$|C\\$|CA\\$|S\\$|SG\\$|Rs\\.?|₹|\\$|€|£|¥)';
const AMOUNT = '(?:[0-9]{1,3}(?:[ ,.]?[0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?)';

function decode(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function attrs(tag) {
  const out = {};
  for (const match of String(tag).matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    out[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return out;
}

function numberFrom(value) {
  const raw = String(value ?? '').replace(/[^0-9.,]/g, '');
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
  const raw = String(value || '').trim();
  const upper = raw.toUpperCase();
  if (CODES.has(upper)) return upper;
  if (/^RS\.?$/i.test(raw)) return 'INR';
  return SYMBOLS.get(raw) || null;
}

function findMicrodata(html) {
  let amount = null;
  let currency = null;
  for (const tag of String(html).match(/<[^>]+>/g) || []) {
    const a = attrs(tag);
    const props = String(a.itemprop || '').toLowerCase().split(/\s+/);
    if (amount == null && (props.includes('price') || a['data-price'] != null || a['data-product-price'] != null)) {
      amount = numberFrom(a.content ?? a.value ?? a['data-price'] ?? a['data-product-price']);
    }
    if (!currency && (props.includes('pricecurrency') || a['data-currency'] != null || a['data-price-currency'] != null)) {
      currency = currencyFrom(a.content ?? a.value ?? a['data-currency'] ?? a['data-price-currency']);
    }
    if (amount != null && currency) return { amount, currency };
  }
  return null;
}

function findVisiblePrice(html) {
  const text = decode(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ');
  const after = new RegExp(`(${AMOUNT})\\s*(${CURRENCY})(?![A-Za-z])`, 'i').exec(text);
  if (after) {
    const amount = numberFrom(after[1]);
    const currency = currencyFrom(after[2]);
    if (amount != null && currency) return { amount, currency };
  }
  const rs = new RegExp(`(Rs\\.?)\\s*(${AMOUNT})`, 'i').exec(text);
  if (rs) {
    const amount = numberFrom(rs[2]);
    if (amount != null) return { amount, currency: 'INR' };
  }
  return null;
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function enhancePublicCommerceHtml(html) {
  const value = String(html || '');
  const found = findMicrodata(value) || findVisiblePrice(value);
  if (!found) return value;
  const injected = `<meta property="product:price:amount" content="${escapeAttr(found.amount)}"><meta property="product:price:currency" content="${escapeAttr(found.currency)}">`;
  return /<head\b[^>]*>/i.test(value)
    ? value.replace(/<head\b[^>]*>/i, (head) => `${head}${injected}`)
    : `${injected}${value}`;
}

export class PublicWebCollector extends BasePublicWebCollector {
  async requestHtml(rawUrl) {
    const response = await super.requestHtml(rawUrl);
    return { ...response, html: enhancePublicCommerceHtml(response.html) };
  }
}
