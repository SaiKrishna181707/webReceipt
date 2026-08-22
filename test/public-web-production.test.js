import test from 'node:test';
import assert from 'node:assert/strict';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';
import { PublicWebCollector } from '../src/integrations/public-web-production.js';

const UNLOCKER_ENDPOINT = 'https://api.brightdata.com/request';
const LIVE_ENV = ['BRIGHT_DATA_API_TOKEN', 'BRIGHT_DATA_UNLOCKER_ZONE', 'WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE'];

async function withLiveEnv(fn) {
  const previous = Object.fromEntries(LIVE_ENV.map((key) => [key, process.env[key]]));
  process.env.BRIGHT_DATA_API_TOKEN = 'test-token';
  process.env.BRIGHT_DATA_UNLOCKER_ZONE = 'test-zone';
  process.env.WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE = 'true';
  try {
    return await fn();
  } finally {
    for (const key of LIVE_ENV) {
      if (previous[key] == null) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test('production collector prefers the explicit current price over an earlier original price', async () => {
  const fetchImpl = async () => new Response(
    '<html><head><title>Camera</title></head><body><p>Original price 199.99 USD</p><p>Now 149.99 USD</p></body></html>',
    { status: 200, headers: { 'content-type': 'text/html' } },
  );
  const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
  const observation = await collector.collect({ url: 'https://shop.example/camera' });
  assert.equal(observation.checkout.finalTotal, 149.99);
  assert.equal(observation.currency, 'USD');
});

test('production collector uses direct public HTML first and sends a browser-like user agent', async () => {
  await withLiveEnv(async () => {
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
    assert.equal(observation.collectorVersion, 'public-web-direct-v1');
  });
});

test('production collector falls back to Web Unlocker for a client-rendered shell', async () => {
  await withLiveEnv(async () => {
    const calls = [];
    const fetchImpl = async (url, init = {}) => {
      calls.push(String(url));
      if (String(url) === UNLOCKER_ENDPOINT) {
        const payload = JSON.parse(init.body);
        assert.equal(payload.zone, 'test-zone');
        assert.equal(payload.url, 'https://dynamic.example/product');
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

test('production collector falls back to Web Unlocker after anti-bot HTTP responses', async () => {
  await withLiveEnv(async () => {
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

test('production collector preserves explicit ISO currencies outside the legacy shortlist', async () => {
  await withLiveEnv(async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(String(url));
      return new Response('<html><head><title>Seoul Hotel</title></head><body><p>Final total KRW 159,000</p></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };

    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    const observation = await collector.collect({ url: 'https://travel.example/seoul' });
    const integrity = evaluateIntegrity(compileDealContract(observation));

    assert.deepEqual(calls, ['https://travel.example/seoul']);
    assert.equal(observation.currency, 'KRW');
    assert.equal(observation.checkout.finalTotal, 159000);
    assert.match(observation.evidence.find((item) => item.field === 'checkout.finalTotal')?.capturedText || '', /KRW/);
    assert.equal(integrity.status, 'valid');
  });
});

test('production collector recognizes regional currency symbols before generic dollar parsing', async () => {
  const fetchImpl = async () => new Response(
    '<html><head><title>Brazil Stay</title></head><body><p>Preço total R$ 1.299,00</p></body></html>',
    { status: 200, headers: { 'content-type': 'text/html' } },
  );
  const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
  const observation = await collector.collect({ url: 'https://travel.example/rio' });

  assert.equal(observation.currency, 'BRL');
  assert.equal(observation.checkout.finalTotal, 1299);
  assert.equal(evaluateIntegrity(compileDealContract(observation)).status, 'valid');
});

test('production collector keeps paid fallback disabled unless explicitly configured', async () => {
  const previous = Object.fromEntries(LIVE_ENV.map((key) => [key, process.env[key]]));
  for (const key of LIVE_ENV) delete process.env[key];
  try {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(String(url));
      return new Response('<html><head><title>No commerce signal</title></head><body><div id="app"></div></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };
    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    await assert.rejects(() => collector.collect({ url: 'https://plain.example/page' }), /No commerce price/);
    assert.deepEqual(calls, ['https://plain.example/page']);
  } finally {
    for (const key of LIVE_ENV) {
      if (previous[key] == null) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
