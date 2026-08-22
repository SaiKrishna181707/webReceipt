import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPublicPageObservation } from '../src/integrations/public-web.js';
import { PublicWebCollector, enhancePublicCommerceHtml } from '../src/integrations/public-web-resilient.js';
import { assertPublicTarget } from '../src/domain/target-policy.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';

function withEnv(values, fn) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value == null) delete process.env[key]; else process.env[key] = value;
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value == null) delete process.env[key]; else process.env[key] = value;
      }
    });
}

test('pasted public URLs without a scheme default to HTTPS and remain policy checked', () => {
  assert.equal(assertPublicTarget('example.com/product#price'), 'https://example.com/product');
  assert.equal(assertPublicTarget('//example.com/product'), 'https://example.com/product');
  assert.throws(() => assertPublicTarget('127.0.0.1:3000/product'), /publicly reachable/);
  assert.throws(() => assertPublicTarget('example.com/account/orders'), /public anonymous/);
});

test('resilient parser bridges amount-before-currency text into the canonical extractor', () => {
  const html = enhancePublicCommerceHtml(
    '<html><head><title>Hotel Room</title></head><body><h1>Hotel Room</h1><p>Total 1,299.50 USD</p><p>Free cancellation.</p></body></html>',
  );
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://hotel.example/room' });
  assert.equal(observation.checkout.finalTotal, 1299.5);
  assert.equal(observation.currency, 'USD');
  assert.equal(evaluateIntegrity(compileDealContract(observation)).status, 'valid');
});

test('resilient parser supports common Indian Rs. pricing', () => {
  const html = enhancePublicCommerceHtml(
    '<html><head><title>Example Item</title></head><body><p>Sale price Rs. 1,299</p></body></html>',
  );
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://shop.example/item' });
  assert.equal(observation.checkout.finalTotal, 1299);
  assert.equal(observation.currency, 'INR');
});

test('resilient parser supports price microdata on non-meta elements', () => {
  const html = enhancePublicCommerceHtml(
    '<html><head><title>Phone</title></head><body><span itemprop="price" content="799.99"></span><span itemprop="priceCurrency" content="USD"></span></body></html>',
  );
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://shop.example/phone' });
  assert.equal(observation.checkout.finalTotal, 799.99);
  assert.equal(observation.currency, 'USD');
});

test('resilient parser extracts commerce data embedded in client-side app state', () => {
  const html = enhancePublicCommerceHtml(`
    <html><head><title>Client Rendered Shoe</title></head><body>
      <div id="app">Loading product…</div>
      <script>window.__PRODUCT__={"name":"Client Rendered Shoe","salePrice":"3499","currency":"INR"}</script>
    </body></html>
  `);
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://shop.example/shoe' });
  assert.equal(observation.checkout.finalTotal, 3499);
  assert.equal(observation.currency, 'INR');
  assert.equal(evaluateIntegrity(compileDealContract(observation)).status, 'valid');
});

test('production resilient collector applies enhancement before Deal Contract compilation', async () => {
  const fetchImpl = async () => new Response(
    '<html><head><title>Ticket</title></head><body><p>Total 49.95 EUR</p><p>Refundable within 24 hours.</p></body></html>',
    { status: 200, headers: { 'content-type': 'text/html' } },
  );
  const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
  const observation = await collector.collect({ url: 'https://tickets.example/event' });
  assert.equal(observation.checkout.finalTotal, 49.95);
  assert.equal(observation.currency, 'EUR');
  assert.equal(evaluateIntegrity(compileDealContract(observation)).status, 'valid');
});

test('production collector falls back to Bright Data Unlocker after a blocked direct request', async () => {
  await withEnv({
    BRIGHT_DATA_API_TOKEN: 'test-token',
    BRIGHT_DATA_UNLOCKER_ZONE: 'test-zone',
    WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE: 'true',
  }, async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(String(url));
      if (String(url) === 'https://api.brightdata.com/request') {
        return new Response(JSON.stringify({ body: '<html><head><title>Unlocked Item</title></head><body><p>Sale price ₹2,499</p></body></html>' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('<html><title>Access denied</title></html>', { status: 403, headers: { 'content-type': 'text/html' } });
    };
    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    const observation = await collector.collect({ url: 'https://blocked.example/item' });
    assert.equal(observation.checkout.finalTotal, 2499);
    assert.equal(observation.currency, 'INR');
    assert.match(observation.collectorVersion, /brightdata/);
    assert.deepEqual(calls, ['https://blocked.example/item', 'https://api.brightdata.com/request']);
  });
});

test('production collector retries through Unlocker when direct HTML has no usable commerce signal', async () => {
  await withEnv({
    BRIGHT_DATA_API_TOKEN: 'test-token',
    BRIGHT_DATA_UNLOCKER_ZONE: 'test-zone',
    WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE: 'true',
  }, async () => {
    let directCalls = 0;
    let unlockerCalls = 0;
    const fetchImpl = async (url) => {
      if (String(url) === 'https://api.brightdata.com/request') {
        unlockerCalls += 1;
        return new Response('<html><head><title>Rendered Product</title></head><body><p>Current price 79.95 USD</p></body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
      directCalls += 1;
      return new Response('<html><head><title>Shell</title></head><body><div id="root"></div></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };
    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    const observation = await collector.collect({ url: 'https://app.example/product' });
    assert.equal(observation.checkout.finalTotal, 79.95);
    assert.equal(observation.currency, 'USD');
    assert.equal(directCalls, 1);
    assert.equal(unlockerCalls, 1);
  });
});
