import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPublicPageObservation } from '../src/integrations/public-web.js';
import { PublicWebCollector, enhancePublicCommerceHtml } from '../src/integrations/public-web-resilient.js';
import { assertPublicTarget } from '../src/domain/target-policy.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';

async function withUnlockerEnv(run) {
  const keys = ['BRIGHT_DATA_API_TOKEN', 'BRIGHT_DATA_UNLOCKER_ZONE', 'WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE'];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  process.env.BRIGHT_DATA_API_TOKEN = 'test-token';
  process.env.BRIGHT_DATA_UNLOCKER_ZONE = 'test-unlocker';
  process.env.WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE = 'true';
  try {
    return await run();
  } finally {
    for (const key of keys) {
      if (saved[key] == null) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
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

test('resilient microdata parsing ignores unrelated numeric metadata', () => {
  const html = enhancePublicCommerceHtml(
    '<html><head><meta name="description" content="Compare over 2024 models"></head><body><span itemprop="price" content="19.99"></span><span itemprop="priceCurrency" content="USD"></span></body></html>',
  );
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://shop.example/widget' });
  assert.equal(observation.checkout.finalTotal, 19.99);
  assert.equal(observation.currency, 'USD');
});

test('resilient parser extracts commerce data from Next.js embedded JSON', () => {
  const html = enhancePublicCommerceHtml(`
    <html><head><title>Rendered Later</title></head><body><div id="__next"></div>
    <script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"product":{"name":"Headphones","currentPrice":{"amount":"249.99","currencyCode":"USD"}}}}}</script>
    </body></html>
  `);
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://shop.example/headphones' });
  assert.equal(observation.checkout.finalTotal, 249.99);
  assert.equal(observation.currency, 'USD');
  assert.equal(evaluateIntegrity(compileDealContract(observation)).status, 'valid');
});

test('resilient parser extracts formatted prices from client-side state', () => {
  const html = enhancePublicCommerceHtml(`
    <html><head><title>Dynamic Product</title></head><body><div id="app"></div>
    <script>window.__STATE__={product:{price:"A$ 89.50"}};</script>
    </body></html>
  `);
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://shop.example/dynamic-product' });
  assert.equal(observation.checkout.finalTotal, 89.5);
  assert.equal(observation.currency, 'AUD');
});

test('resilient parser prefers price-labelled visible text over unrelated currency mentions', () => {
  const html = enhancePublicCommerceHtml(
    '<html><head><title>Course</title></head><body><p>Shipping insurance can cost $5.</p><p>Sale price: $129.00</p></body></html>',
  );
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://shop.example/course' });
  assert.equal(observation.checkout.finalTotal, 129);
  assert.equal(observation.currency, 'USD');
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

test('configured public collector keeps direct fetch as the zero-credit fast path', async () => {
  await withUnlockerEnv(async () => {
    const requested = [];
    const fetchImpl = async (url) => {
      requested.push(String(url));
      if (String(url) === 'https://api.brightdata.com/request') throw new Error('unlocker should not be called');
      return new Response('<html><head><title>Direct Product</title></head><body><p>Sale price $42.00</p></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };
    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    const observation = await collector.collect({ url: 'https://shop.example/direct' });
    assert.equal(observation.checkout.finalTotal, 42);
    assert.equal(observation.collectorVersion, 'public-web-direct-v1');
    assert.deepEqual(requested, ['https://shop.example/direct']);
  });
});

test('configured public collector falls back to Bright Data when direct HTML is only an app shell', async () => {
  await withUnlockerEnv(async () => {
    const requested = [];
    const fetchImpl = async (url) => {
      requested.push(String(url));
      if (String(url) === 'https://api.brightdata.com/request') {
        const rendered = '<html><head><title>Rendered Product</title></head><body><div id="__next"></div><script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"product":{"currentPrice":{"amount":"149.95","currencyCode":"USD"}}}}}</script></body></html>';
        return new Response(JSON.stringify({ status_code: 200, body: rendered }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('<html><head><title>App Shell</title></head><body><div id="app"></div></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };
    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    const observation = await collector.collect({ url: 'https://shop.example/rendered' });
    assert.equal(observation.checkout.finalTotal, 149.95);
    assert.equal(observation.currency, 'USD');
    assert.equal(observation.collectorVersion, 'public-web-brightdata-v1');
    assert.deepEqual(requested, ['https://shop.example/rendered', 'https://api.brightdata.com/request']);
  });
});

test('configured public collector falls back to Bright Data on access challenges', async () => {
  await withUnlockerEnv(async () => {
    const requested = [];
    const fetchImpl = async (url) => {
      requested.push(String(url));
      if (String(url) === 'https://api.brightdata.com/request') {
        return new Response(JSON.stringify({
          status_code: 200,
          body: '<html><head><title>Unlocked</title></head><body><p>Total 79.00 USD</p></body></html>',
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('<html><head><title>Just a moment...</title></head><body>Verify you are human</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    };
    const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
    const observation = await collector.collect({ url: 'https://shop.example/challenged' });
    assert.equal(observation.checkout.finalTotal, 79);
    assert.equal(observation.collectorVersion, 'public-web-brightdata-v1');
    assert.deepEqual(requested, ['https://shop.example/challenged', 'https://api.brightdata.com/request']);
  });
});
