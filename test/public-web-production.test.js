import test from 'node:test';
import assert from 'node:assert/strict';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';
import { extractPublicPageObservation } from '../src/integrations/public-web.js';
import {
  PublicWebCollector,
  enhanceProductionCommerceHtml,
} from '../src/integrations/public-web-production.js';

const UNLOCKER_ENDPOINT = 'https://api.brightdata.com/request';
const LIVE_ENV = ['BRIGHT_DATA_API_TOKEN', 'BRIGHT_DATA_UNLOCKER_ZONE', 'WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE'];

async function withEnv(values, fn) {
  const previous = Object.fromEntries(LIVE_ENV.map((key) => [key, process.env[key]]));
  try {
    for (const key of LIVE_ENV) {
      if (values[key] == null) delete process.env[key];
      else process.env[key] = values[key];
    }
    return await fn();
  } finally {
    for (const key of LIVE_ENV) {
      if (previous[key] == null) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

function validObservation(html, sourceUrl = 'https://shop.example/item') {
  const observation = extractPublicPageObservation(html, { sourceUrl });
  assert.equal(evaluateIntegrity(compileDealContract(observation)).status, 'valid');
  return observation;
}

test('production enhancement prefers a current suffix price over an original price', () => {
  const html = '<html><head><title>Camera</title></head><body><p>Original price 199.99 USD</p><p>Now 149.99 USD</p></body></html>';
  const enhanced = enhanceProductionCommerceHtml(html, { sourceUrl: 'https://shop.example/camera' });
  const observation = validObservation(enhanced, 'https://shop.example/camera');
  assert.equal(observation.checkout.finalTotal, 149.99);
  assert.equal(observation.currency, 'USD');
});

test('production enhancement extracts commerce values from embedded Next-style JSON state', () => {
  const html = `<!doctype html><html><head><title>Headphones</title></head><body><div id="root"></div>
    <script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"product":{"name":"Headphones","currentPrice":"79.50","currency":"USD"}}}}</script>
  </body></html>`;
  const enhanced = enhanceProductionCommerceHtml(html, { sourceUrl: 'https://shop.example/headphones' });
  const observation = validObservation(enhanced, 'https://shop.example/headphones');
  assert.equal(observation.checkout.finalTotal, 79.5);
  assert.equal(observation.currency, 'USD');
});

test('production collector uses direct public HTML first even when Web Unlocker is configured', async () => {
  await withEnv({
    BRIGHT_DATA_API_TOKEN: 'test-token',
    BRIGHT_DATA_UNLOCKER_ZONE: 'test-zone',
    WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE: 'true',
  }, async () => {
    const calls = [];
    let userAgent = '';
    const fetchImpl = async (url, init = {}) => {
      calls.push(String(url));
      userAgent = init.headers?.['User-Agent'] || '';
      return new Response('<html><head><title>Ticket</title></head><body><p>Price $49.95</p></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };
    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    const observation = await collector.collect({ url: 'https://tickets.example/event' });
    assert.deepEqual(calls, ['https://tickets.example/event']);
    assert.match(userAgent, /Chrome\//);
    assert.doesNotMatch(userAgent, /WebReceiptBot/i);
    assert.equal(observation.checkout.finalTotal, 49.95);
  });
});

test('production collector falls back to Web Unlocker for a JS shell with no server-rendered commerce data', async () => {
  await withEnv({
    BRIGHT_DATA_API_TOKEN: 'test-token',
    BRIGHT_DATA_UNLOCKER_ZONE: 'test-zone',
    WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE: 'true',
  }, async () => {
    const calls = [];
    const fetchImpl = async (url, init = {}) => {
      calls.push(String(url));
      if (String(url) === UNLOCKER_ENDPOINT) {
        const payload = JSON.parse(init.body);
        assert.equal(payload.url, 'https://dynamic.example/product');
        assert.equal(payload.zone, 'test-zone');
        return new Response('<html><head><title>Dynamic Product</title></head><body><p>Checkout total 89.99 USD</p></body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
      return new Response('<html><head><title>Dynamic Product</title></head><body><div id="app"></div><script src="/app.js"></script></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };
    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    const observation = await collector.collect({ url: 'https://dynamic.example/product' });
    assert.deepEqual(calls, ['https://dynamic.example/product', UNLOCKER_ENDPOINT]);
    assert.equal(observation.checkout.finalTotal, 89.99);
    assert.equal(observation.collectorVersion, 'public-web-brightdata-v1');
  });
});

test('production collector falls back to Web Unlocker on anti-bot HTTP responses', async () => {
  await withEnv({
    BRIGHT_DATA_API_TOKEN: 'test-token',
    BRIGHT_DATA_UNLOCKER_ZONE: 'test-zone',
    WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE: 'true',
  }, async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(String(url));
      if (String(url) === UNLOCKER_ENDPOINT) {
        return new Response('<html><head><title>Shoes</title></head><body><p>Sale price USD 129.00</p></body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
      return new Response('Forbidden', { status: 403, headers: { 'content-type': 'text/plain' } });
    };
    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    const observation = await collector.collect({ url: 'https://protected.example/shoes' });
    assert.deepEqual(calls, ['https://protected.example/shoes', UNLOCKER_ENDPOINT]);
    assert.equal(observation.checkout.finalTotal, 129);
  });
});
