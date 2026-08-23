import { extractPublicPageObservation } from './public-web.js';
import {
  PublicWebCollector as ResilientPublicWebCollector,
  enhancePublicCommerceHtml,
} from './public-web-resilient.js';
import {
  AMOUNT_PATTERN,
  CURRENCY_PATTERN,
  SUPPORTED_CURRENCY_CODES,
  decodeHtmlEntities,
} from './html-text.js';

const MAX_REDIRECTS = 5;
const UNLOCKER_ENDPOINT = 'https://api.brightdata.com/request';
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const PRIORITY_LABELS = [
  ['grand total', 50], ['order total', 49], ['final total', 48], ['checkout total', 47],
  ['total due', 46], ['amount due', 45], ['payable', 44], ['sale price', 38],
  ['current price', 37], ['deal price', 36], ['our price', 35], ['special price', 34],
  ['pay now', 33], ['now', 30],
];
const ISO_CURRENCY_CODES = new Set(`
  AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD
  CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD
  GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD
  KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO
  NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS
  SRD SSP STN SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF
  XCD XOF XPF YER ZAR ZMW ZWL
`.trim().split(/\s+/));
const FALLBACK_CURRENCIES = [...ISO_CURRENCY_CODES].filter((code) => !SUPPORTED_CURRENCY_CODES.has(code));
const FALLBACK_CODE_PATTERN = FALLBACK_CURRENCIES.join('|');
const REGIONAL_SYMBOLS = [
  ['CN¥', 'CNY'], ['HK$', 'HKD'], ['NZ$', 'NZD'], ['MX$', 'MXN'],
  ['R$', 'BRL'], ['₩', 'KRW'], ['₽', 'RUB'], ['₺', 'TRY'], ['₴', 'UAH'],
  ['฿', 'THB'], ['₱', 'PHP'], ['₫', 'VND'], ['₪', 'ILS'], ['zł', 'PLN'],
  ['Kč', 'CZK'], ['Rp', 'IDR'], ['RM', 'MYR'],
];
const PRICE_EVIDENCE_FIELDS = new Set(['offer.advertisedPrice', 'checkout.basePrice', 'checkout.finalTotal']);

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

function probeExtraction(html, sourceUrl) {
  try {
    return extractPublicPageObservation(html, { sourceUrl, collectorVersion: 'public-web-production-probe' });
  } catch (error) {
    if (/No commerce price with an identifiable currency/i.test(String(error?.message || error))) return null;
    throw error;
  }
}

function canExtract(html, sourceUrl) {
  return Boolean(probeExtraction(html, sourceUrl));
}

function visibleText(html) {
  return decodeHtmlEntities(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeCurrency(value) {
  const raw = String(value || '').trim();
  const upper = raw.toUpperCase();
  if (SUPPORTED_CURRENCY_CODES.has(upper)) return upper;
  if (/^RS\.?$/i.test(raw) || raw === '₹') return 'INR';
  if (raw === '$' || /^US\$$/i.test(raw)) return 'USD';
  if (raw === '€') return 'EUR';
  if (raw === '£') return 'GBP';
  if (raw === '¥') return 'JPY';
  if (/^(?:A|AU)\$$/i.test(raw)) return 'AUD';
  if (/^(?:C|CA)\$$/i.test(raw)) return 'CAD';
  if (/^(?:S|SG)\$$/i.test(raw)) return 'SGD';
  return null;
}

function findPriorityPrice(html) {
  const text = visibleText(html);
  if (!text) return null;
  let selected = null;
  for (const [label, score] of PRIORITY_LABELS) {
    const prefix = escapeRegex(label);
    const patterns = [
      new RegExp(`\\b${prefix}\\b\\s*[:=–—-]?\\s*(${CURRENCY_PATTERN})\\s*(${AMOUNT_PATTERN})(?![0-9A-Za-z])`, 'ig'),
      new RegExp(`\\b${prefix}\\b\\s*[:=–—-]?\\s*(${AMOUNT_PATTERN})\\s*(${CURRENCY_PATTERN})(?![A-Za-z])`, 'ig'),
    ];
    for (let order = 0; order < patterns.length; order++) {
      for (const match of text.matchAll(patterns[order])) {
        const amount = order === 0 ? match[2] : match[1];
        const currency = normalizeCurrency(order === 0 ? match[1] : match[2]);
        if (!currency) continue;
        const candidate = { amount, currency, score, index: match.index || 0 };
        if (!selected || candidate.score > selected.score || (candidate.score === selected.score && candidate.index > selected.index)) selected = candidate;
      }
    }
  }
  return selected;
}

function injectPriorityPrice(html, selected) {
  if (!selected) return String(html || '');
  const amount = String(selected.amount).replace(/[^0-9.,]/g, '');
  if (!amount) return String(html || '');
  const injected = `<meta property="product:price:amount" content="${amount}"><meta property="product:price:currency" content="${selected.currency}">`;
  const value = String(html || '');
  return /<head\b[^>]*>/i.test(value)
    ? value.replace(/<head\b[^>]*>/i, (head) => `${head}${injected}`)
    : `${injected}${value}`;
}

export function enhanceProductionCommerceHtml(html) {
  const prepared = enhancePublicCommerceHtml(html);
  return injectPriorityPrice(prepared, findPriorityPrice(html));
}

function parseAttributes(tag) {
  const out = {};
  for (const match of String(tag).matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    out[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '');
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

function fallbackContextScore(value) {
  const text = String(value || '').toLowerCase();
  let score = 5;
  if (/grand\s*total|order\s*total|final\s*total|checkout\s*total|total\s*due|amount\s*due|payable/.test(text)) score += 30;
  else if (/\btotal\b/.test(text)) score += 15;
  if (/sale\s*price|current\s*price|deal\s*price|our\s*price|special\s*price|\bprice\b|\bnow\b|pay\s*now|\boffer\b/.test(text)) score += 12;
  if (/\bwas\b|list\s*price|original\s*price|regular\s*price|\bmrp\b/.test(text)) score -= 16;
  if (/shipping|delivery|tax(?:es)?|service\s*fee|booking\s*fee/.test(text) && !/\btotal\b/.test(text)) score -= 16;
  return score;
}

function bestFallbackTextMatch(text, patterns) {
  const candidates = [];
  for (const { regex, currencyAt, amountAt, fixedCurrency } of patterns) {
    for (const match of text.matchAll(regex)) {
      const amount = numberFrom(match[amountAt]);
      const currency = fixedCurrency || String(match[currencyAt] || '').toUpperCase();
      if (amount == null || !ISO_CURRENCY_CODES.has(currency)) continue;
      const index = match.index || 0;
      const context = text.slice(Math.max(0, index - 100), Math.min(text.length, index + match[0].length + 100));
      candidates.push({ amount, currency, score: fallbackContextScore(context), index });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  return candidates[0]?.score >= 0 ? candidates[0] : null;
}

function findRegionalSymbolPrice(html) {
  const text = visibleText(html);
  if (!text) return null;
  const patterns = [];
  for (const [symbol, currency] of REGIONAL_SYMBOLS) {
    const escaped = escapeRegex(symbol);
    patterns.push(
      { regex: new RegExp(`${escaped}\\s*(${AMOUNT_PATTERN})`, 'gi'), currencyAt: 0, amountAt: 1, fixedCurrency: currency },
      { regex: new RegExp(`(${AMOUNT_PATTERN})\\s*${escaped}`, 'gi'), currencyAt: 0, amountAt: 1, fixedCurrency: currency },
    );
  }
  return bestFallbackTextMatch(text, patterns);
}

function findFallbackMicrodataPrice(html) {
  let amount = null;
  let currency = null;
  for (const tag of String(html || '').match(/<[^>]+>/g) || []) {
    const attrs = parseAttributes(tag);
    const props = String(attrs.itemprop || attrs.property || attrs.name || '').toLowerCase().split(/\s+/);
    if (amount == null && (props.some((prop) => /(?:^|:)price$/.test(prop)) || attrs['data-price'] != null || attrs['data-product-price'] != null || attrs['data-sale-price'] != null)) {
      amount = numberFrom(attrs.content ?? attrs.value ?? attrs['data-price'] ?? attrs['data-product-price'] ?? attrs['data-sale-price']);
    }
    if (!currency && (props.some((prop) => /pricecurrency$/.test(prop)) || attrs['data-currency'] != null || attrs['data-price-currency'] != null)) {
      const candidate = String(attrs.content ?? attrs.value ?? attrs['data-currency'] ?? attrs['data-price-currency'] ?? '').trim().toUpperCase();
      if (FALLBACK_CURRENCIES.includes(candidate)) currency = candidate;
    }
    if (amount != null && currency) return { amount, currency, score: 50 };
  }
  return null;
}

function findFallbackStructuredPrice(html) {
  const value = String(html || '');
  const currencyPattern = /(?:priceCurrency|currencyCode|currency_code|currency)\s*["']?\s*[:=]\s*["']([A-Z]{3})["']/gi;
  for (const currencyMatch of value.matchAll(currencyPattern)) {
    const currency = String(currencyMatch[1] || '').toUpperCase();
    if (!FALLBACK_CURRENCIES.includes(currency)) continue;
    const index = currencyMatch.index || 0;
    const context = value.slice(Math.max(0, index - 700), Math.min(value.length, index + currencyMatch[0].length + 700));
    const priceMatch = /(?:finalPrice|currentPrice|salePrice|discountedPrice|lowPrice|price|amount|value)\s*["']?\s*[:=]\s*["']?([0-9][0-9\s,.'’]*(?:[.,][0-9]{1,2})?)/i.exec(context);
    const amount = numberFrom(priceMatch?.[1]);
    if (amount != null) return { amount, currency, score: 45 };
  }
  return null;
}

function findFallbackCodePrice(html) {
  if (!FALLBACK_CODE_PATTERN) return null;
  const text = visibleText(html);
  if (!text) return null;
  return bestFallbackTextMatch(text, [
    { regex: new RegExp(`\\b(${FALLBACK_CODE_PATTERN})\\b\\s*(${AMOUNT_PATTERN})`, 'gi'), currencyAt: 1, amountAt: 2 },
    { regex: new RegExp(`(${AMOUNT_PATTERN})\\s*\\b(${FALLBACK_CODE_PATTERN})\\b`, 'gi'), currencyAt: 2, amountAt: 1 },
  ]);
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function injectFallbackPrice(html, { amount, currency }) {
  const value = String(html || '');
  const injected = `<meta property="product:price:amount" content="${escapeAttr(amount)}"><meta property="product:price:currency" content="USD"><meta name="webreceipt:source-currency" content="${escapeAttr(currency)}">`;
  return /<head\b[^>]*>/i.test(value)
    ? value.replace(/<head\b[^>]*>/i, (head) => `${head}${injected}`)
    : `${injected}${value}`;
}

function prepareProductionCommerceHtml(html, sourceUrl) {
  const prepared = enhanceProductionCommerceHtml(html);
  const regional = findRegionalSymbolPrice(html);
  const existing = probeExtraction(prepared, sourceUrl);
  if (existing) {
    const sameAmount = regional && Math.abs(Number(existing.checkout.finalTotal) - regional.amount) < 0.000001;
    const ambiguousBase = existing.currency === 'USD' || existing.currency === 'JPY';
    if (regional && sameAmount && ambiguousBase) {
      return { html: injectFallbackPrice(prepared, regional), fallbackCurrency: regional.currency, extractable: true };
    }
    return { html: prepared, fallbackCurrency: null, extractable: true };
  }

  const fallback = findFallbackMicrodataPrice(html)
    || findFallbackStructuredPrice(html)
    || regional
    || findFallbackCodePrice(html);
  if (fallback) {
    return { html: injectFallbackPrice(prepared, fallback), fallbackCurrency: fallback.currency, extractable: true };
  }
  return { html: prepared, fallbackCurrency: null, extractable: false };
}

function restoreFallbackCurrency(observation, currency) {
  return {
    ...observation,
    currency,
    evidence: observation.evidence.map((item) => PRICE_EVIDENCE_FIELDS.has(item.field)
      ? { ...item, capturedText: String(item.capturedText || '').replace(/\bUSD\b/g, currency) }
      : item),
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
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function boundedBody(value, maxBytes) {
  const body = String(value ?? '');
  if (Buffer.byteLength(body) > maxBytes) throw new Error(`Public page response exceeds ${maxBytes} bytes.`);
  return body;
}

function shouldRetryWithUnlocker(error) {
  const message = String(error?.message || error);
  if (/timed out|fetch failed|redirect .*location|exceeded \d+ redirects/i.test(message)) return true;
  const status = Number(message.match(/Public page returned HTTP (\d{3})/i)?.[1]);
  return [401, 403, 408, 409, 425, 429, 451].includes(status) || status >= 500;
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
        // Some upstreams incorrectly label raw HTML as JSON. Keep the raw body.
      }
    }

    return {
      html: boundedBody(html, this.maxBytes),
      sourceUrl: targetUrl,
      via: 'brightdata-unlocker',
    };
  }

  async requestHtml(rawUrl) {
    try {
      const direct = await this.requestDirectHtml(rawUrl);
      const prepared = prepareProductionCommerceHtml(direct.html, direct.sourceUrl);
      this.fallbackCurrency = prepared.fallbackCurrency;
      if (prepared.extractable || !unlockerConfigured()) {
        return { ...direct, html: prepared.html };
      }
    } catch (error) {
      this.fallbackCurrency = null;
      if (!unlockerConfigured() || !shouldRetryWithUnlocker(error)) throw error;
    }

    // Direct public HTML is always attempted first. Web Unlocker is reserved for
    // anti-bot responses and client-rendered pages that expose no usable commerce
    // signal in the server response, so anonymous traffic does not spend credits
    // when a normal fetch is already sufficient.
    const unlocked = await this.requestUnlockedHtml(rawUrl);
    const prepared = prepareProductionCommerceHtml(unlocked.html, unlocked.sourceUrl);
    this.fallbackCurrency = prepared.fallbackCurrency;
    return { ...unlocked, html: prepared.html };
  }

  async collect(options = {}) {
    this.fallbackCurrency = null;
    try {
      const observation = await super.collect(options);
      return this.fallbackCurrency ? restoreFallbackCurrency(observation, this.fallbackCurrency) : observation;
    } finally {
      this.fallbackCurrency = null;
    }
  }
}
