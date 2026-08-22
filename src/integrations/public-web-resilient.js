import { PublicWebCollector as BasePublicWebCollector } from './public-web.js';

const MAX_REDIRECTS = 5;
const SYMBOLS = new Map([
  ['₹', 'INR'], ['$', 'USD'], ['€', 'EUR'], ['£', 'GBP'], ['¥', 'JPY'],
  ['A$', 'AUD'], ['AU$', 'AUD'], ['C$', 'CAD'], ['CA$', 'CAD'], ['S$', 'SGD'], ['SG$', 'SGD'],
]);
const CODES = new Set(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD']);
const CURRENCY = '(?:INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD|A\\$|AU\\$|C\\$|CA\\$|S\\$|SG\\$|Rs\\.?|₹|\\$|€|£|¥)';
const AMOUNT = '(?:[0-9]{1,3}(?:[ ,.]?[0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?)';
const PRICE_KEY = '(?:salePrice|sale_price|currentPrice|current_price|finalPrice|final_price|offerPrice|offer_price|price)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function enabled(name) {
  return /^(1|true|yes)$/i.test(String(process.env[name] || '').trim());
}

function decode(value) {
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

function currencyInWindow(value) {
  const keyed = /(?:priceCurrency|price_currency|currencyCode|currency_code|currency)\s*["']?\s*[:=]\s*["']?([A-Z]{3}|A\$|AU\$|C\$|CA\$|S\$|SG\$|₹|\$|€|£|¥)/i.exec(value);
  if (keyed) return currencyFrom(keyed[1]);
  const code = /\b(INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD)\b/i.exec(value);
  if (code) return currencyFrom(code[1]);
  const symbol = /(₹|A\$|AU\$|C\$|CA\$|S\$|SG\$|\$|€|£|¥)/.exec(value);
  return symbol ? currencyFrom(symbol[1]) : null;
}

function findMicrodata(html) {
  let amount = null;
  let currency = null;
  for (const tag of String(html).match(/<[^>]+>/g) || []) {
    const a = attrs(tag);
    const props = String(a.itemprop || '').toLowerCase().split(/\s+/);
    if (amount == null && (props.includes('price') || a['data-price'] != null || a['data-product-price'] != null || a['data-sale-price'] != null || a['data-current-price'] != null)) {
      amount = numberFrom(a.content ?? a.value ?? a['data-price'] ?? a['data-product-price'] ?? a['data-sale-price'] ?? a['data-current-price']);
    }
    if (!currency && (props.includes('pricecurrency') || a['data-currency'] != null || a['data-price-currency'] != null)) {
      currency = currencyFrom(a.content ?? a.value ?? a['data-currency'] ?? a['data-price-currency']);
    }
    if (amount != null && currency) return { amount, currency, score: 20 };
  }
  return null;
}

function findSerializedPrice(html) {
  const value = decode(String(html || ''));
  const candidates = [];
  const numeric = new RegExp(`["']?(${PRICE_KEY})["']?\\s*:\\s*["']?(${AMOUNT})["']?`, 'gi');
  for (const match of value.matchAll(numeric)) {
    const amount = numberFrom(match[2]);
    if (amount == null) continue;
    const start = Math.max(0, (match.index || 0) - 350);
    const end = Math.min(value.length, (match.index || 0) + match[0].length + 350);
    const currency = currencyInWindow(value.slice(start, end));
    if (!currency) continue;
    const key = String(match[1]).toLowerCase();
    const score = /sale|current|final|offer/.test(key) ? 18 : 15;
    candidates.push({ amount, currency, score });
  }

  const objectPattern = new RegExp(`["']?price["']?\\s*:\\s*\\{([\\s\\S]{0,500}?)\\}`, 'gi');
  for (const match of value.matchAll(objectPattern)) {
    const body = match[1];
    const amountMatch = new RegExp(`["']?(?:amount|value|current|sale)["']?\\s*:\\s*["']?(${AMOUNT})`, 'i').exec(body);
    if (!amountMatch) continue;
    const amount = numberFrom(amountMatch[1]);
    const currency = currencyInWindow(body);
    if (amount != null && currency) candidates.push({ amount, currency, score: 17 });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

function scoreContext(text, index) {
  const before = text.slice(Math.max(0, index - 90), index).toLowerCase();
  const around = text.slice(Math.max(0, index - 45), Math.min(text.length, index + 90)).toLowerCase();
  let score = 0;
  if (/\b(?:sale|now|current|final|total|pay|price|from|starting|deal|offer)\b/.test(around)) score += 6;
  if (/\b(?:mrp|list price|original|was|save|discount|shipping|delivery)\b/.test(before)) score -= 3;
  return score;
}

function findVisiblePrice(html) {
  const text = decode(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ');

  const candidates = [];
  const prefix = new RegExp(`(${CURRENCY})\\s*(${AMOUNT})(?![0-9])`, 'gi');
  for (const match of text.matchAll(prefix)) {
    const amount = numberFrom(match[2]);
    const currency = currencyFrom(match[1]);
    if (amount != null && currency) candidates.push({ amount, currency, score: 10 + scoreContext(text, match.index || 0), index: match.index || 0 });
  }
  const suffix = new RegExp(`(${AMOUNT})\\s*(${CURRENCY})(?![A-Za-z])`, 'gi');
  for (const match of text.matchAll(suffix)) {
    const amount = numberFrom(match[1]);
    const currency = currencyFrom(match[2]);
    if (amount != null && currency) candidates.push({ amount, currency, score: 10 + scoreContext(text, match.index || 0), index: match.index || 0 });
  }
  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  return candidates[0] || null;
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function enhancePublicCommerceHtml(html) {
  const value = String(html || '');
  const found = findMicrodata(value) || findSerializedPrice(value) || findVisiblePrice(value);
  if (!found) return value;
  const injected = `<meta property="product:price:amount" content="${escapeAttr(found.amount)}"><meta property="product:price:currency" content="${escapeAttr(found.currency)}">`;
  return /<head\b[^>]*>/i.test(value)
    ? value.replace(/<head\b[^>]*>/i, (head) => `${head}${injected}`)
    : `${injected}${value}`;
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

function unlockerConfigured() {
  return Boolean(
    String(process.env.BRIGHT_DATA_API_TOKEN || '').trim()
      && String(process.env.BRIGHT_DATA_UNLOCKER_ZONE || '').trim()
      && enabled('WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE'),
  );
}

function looksLikeChallenge(html) {
  const value = String(html || '').slice(0, 250_000);
  return /<title>\s*(?:just a moment|access denied|attention required|security check|challenge)\b/i.test(value)
    || /cf-chl-|cloudflare ray id|verify you are human|enable javascript and cookies|captcha-delivery\.com|akamai bot manager/i.test(value);
}

export class PublicWebCollector extends BasePublicWebCollector {
  constructor(options = {}) {
    super(options);
    this.forceUnlocker = false;
  }

  async requestDirect(rawUrl) {
    let current = await this.resolveTarget(rawUrl);
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
      let response;
      try {
        response = await this.fetchImpl(current, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': BROWSER_UA,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            'Upgrade-Insecure-Requests': '1',
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

  async requestUnlocker(rawUrl) {
    const targetUrl = await this.resolveTarget(rawUrl);
    const timeoutMs = envNumber('PUBLIC_WEB_UNLOCKER_TIMEOUT_MS', Math.max(this.timeoutMs, 45_000));
    let response;
    try {
      response = await this.fetchImpl('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${String(process.env.BRIGHT_DATA_API_TOKEN).trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zone: String(process.env.BRIGHT_DATA_UNLOCKER_ZONE).trim(),
          url: targetUrl,
          format: 'raw',
          method: 'GET',
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error?.name === 'TimeoutError' || /aborted|timeout/i.test(String(error?.message || error))) {
        throw new Error(`Bright Data Unlocker timed out after ${timeoutMs}ms.`);
      }
      throw new Error(`Bright Data Unlocker request failed: ${error?.message || error}`);
    }
    if (!response.ok) throw new Error(`Bright Data Unlocker failed: ${response.status} ${(await response.text()).slice(0, 500)}`);
    const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
      const body = await response.json();
      if (body && typeof body === 'object' && typeof body.body === 'string') {
        if (Buffer.byteLength(body.body) > this.maxBytes) throw new Error(`Public page response exceeds ${this.maxBytes} bytes.`);
        return { html: body.body, sourceUrl: targetUrl, via: 'brightdata-unlocker' };
      }
      if (typeof body === 'string') {
        if (Buffer.byteLength(body) > this.maxBytes) throw new Error(`Public page response exceeds ${this.maxBytes} bytes.`);
        return { html: body, sourceUrl: targetUrl, via: 'brightdata-unlocker' };
      }
    }
    return { html: await readTextLimited(response, this.maxBytes), sourceUrl: targetUrl, via: 'brightdata-unlocker' };
  }

  async requestHtml(rawUrl) {
    let response;
    if (this.forceUnlocker && unlockerConfigured()) {
      response = await this.requestUnlocker(rawUrl);
    } else {
      try {
        response = await this.requestDirect(rawUrl);
        if (looksLikeChallenge(response.html) && unlockerConfigured()) response = await this.requestUnlocker(rawUrl);
      } catch (directError) {
        if (!unlockerConfigured()) throw directError;
        try {
          response = await this.requestUnlocker(rawUrl);
        } catch (unlockerError) {
          throw new Error(`Public page fetch failed after direct and Bright Data fallback: ${directError.message}; ${unlockerError.message}`);
        }
      }
    }
    return { ...response, html: enhancePublicCommerceHtml(response.html) };
  }

  async collect(options = {}) {
    try {
      return await super.collect(options);
    } catch (error) {
      if (!unlockerConfigured() || this.forceUnlocker || !/No commerce price with an identifiable currency/i.test(String(error?.message || error))) throw error;
      this.forceUnlocker = true;
      try { return await super.collect(options); }
      finally { this.forceUnlocker = false; }
    }
  }
}
