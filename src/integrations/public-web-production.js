import { extractPublicPageObservation } from './public-web.js';
import {
  PublicWebCollector as ResilientPublicWebCollector,
  enhancePublicCommerceHtml,
} from './public-web-resilient.js';

const MAX_REDIRECTS = 5;
const UNLOCKER_ENDPOINT = 'https://api.brightdata.com/request';
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const CURRENCY = '(?:INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD|US\\$|A\\$|AU\\$|C\\$|CA\\$|S\\$|SG\\$|Rs\\.?|₹|\\$|€|£|¥)';
const AMOUNT = '(?:[0-9]{1,3}(?:[ ,.]?[0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?)';
const PRIORITY_LABELS = [
  ['grand total', 50], ['order total', 49], ['final total', 48], ['checkout total', 47],
  ['total due', 46], ['amount due', 45], ['payable', 44], ['sale price', 38],
  ['current price', 37], ['deal price', 36], ['our price', 35], ['special price', 34],
  ['pay now', 33], ['now', 30],
];

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

function canExtract(html, sourceUrl) {
  try {
    extractPublicPageObservation(html, { sourceUrl, collectorVersion: 'public-web-production-probe' });
    return true;
  } catch (error) {
    if (/No commerce price with an identifiable currency/i.test(String(error?.message || error))) return false;
    throw error;
  }
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;|\u00a0/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
}

function visibleText(html) {
  return decodeEntities(String(html || '')
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
  if (['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD'].includes(upper)) return upper;
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
      new RegExp(`\\b${prefix}\\b\\s*[:=–—-]?\\s*(${CURRENCY})\\s*(${AMOUNT})(?![0-9A-Za-z])`, 'ig'),
      new RegExp(`\\b${prefix}\\b\\s*[:=–—-]?\\s*(${AMOUNT})\\s*(${CURRENCY})(?![A-Za-z])`, 'ig'),
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
      const html = enhanceProductionCommerceHtml(direct.html);
      if (canExtract(html, direct.sourceUrl) || !unlockerConfigured()) {
        return { ...direct, html };
      }
    } catch (error) {
      if (!unlockerConfigured() || !shouldRetryWithUnlocker(error)) throw error;
    }

    // Direct public HTML is always attempted first. Web Unlocker is reserved for
    // anti-bot responses and client-rendered pages that expose no usable commerce
    // signal in the server response, so anonymous traffic does not spend credits
    // when a normal fetch is already sufficient.
    const unlocked = await this.requestUnlockedHtml(rawUrl);
    return { ...unlocked, html: enhanceProductionCommerceHtml(unlocked.html) };
  }
}
