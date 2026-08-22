import { extractPublicPageObservation } from './public-web.js';
import {
  PublicWebCollector as ResilientPublicWebCollector,
  enhancePublicCommerceHtml,
} from './public-web-resilient.js';

const MAX_REDIRECTS = 5;
const UNLOCKER_ENDPOINT = 'https://api.brightdata.com/request';
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

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
      const html = enhancePublicCommerceHtml(direct.html);
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
    return { ...unlocked, html: enhancePublicCommerceHtml(unlocked.html) };
  }
}
