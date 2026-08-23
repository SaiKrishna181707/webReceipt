import test from 'node:test';
import assert from 'node:assert/strict';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';
import { selectVisibleCommercePrice } from '../src/integrations/commerce-price.js';
import { PublicWebCollector } from '../src/integrations/public-web-live.js';

function collectorFor(html) {
  return new PublicWebCollector({
    fetchImpl: async () => new Response(html, { status: 200, headers: { 'content-type': 'text/html' } }),
    resolveTarget: async (url) => url,
  });
}

test('Nike-style selling price beats an earlier coupon amount and a later actual price', async () => {
  const html = `
    <html><head><title>Nike Air Jordan 1 Mid SE</title></head><body>
      <h1>Nike Air Jordan 1 Mid SE Men's Shoes</h1>
      <p>Enjoy ₹500 off with code APP500.</p>
      <div>Selling price ₹12,295</div>
      <div>Actual price ₹13,995</div>
      <div>12% off</div>
    </body></html>`;

  const ranked = selectVisibleCommercePrice(html);
  assert.equal(ranked.ambiguous, false);
  assert.equal(ranked.candidate?.amount, 12295);
  assert.equal(ranked.candidate?.currency, 'INR');
  assert.match(ranked.candidate?.capturedText || '', /Selling price.*12,295/i);

  const observation = await collectorFor(html).collect({ url: 'https://www.nike.in/product/example' });
  assert.equal(observation.checkout.finalTotal, 12295);
  assert.equal(observation.offer.advertisedPrice, 12295);
  assert.equal(observation.currency, 'INR');
  assert.match(observation.evidence.find((item) => item.field === 'checkout.finalTotal')?.capturedText || '', /Selling price.*12,295/i);
  assert.equal(evaluateIntegrity(compileDealContract(observation)).status, 'valid');
});

test('Nike product-detail layout with a bare rupee price beats promo, shipping and recommendations', async () => {
  const html = `
    <html><head><title>Buy Nike Pegasus 42 Online</title></head><body>
      <p>Get ₹500 off with code RUN500.</p>
      <h1>Nike Pegasus 42</h1>
      <h2>Men's Road-Running Shoes</h2>
      <p>Shipping ₹499</p>
      <div>₹12,995</div>
      <p>Inclusive of all taxes</p>
      <button>Add to Bag</button>
      <section><h3>You might also like</h3><div>₹8,995</div><div>₹14,995</div></section>
    </body></html>`;

  const ranked = selectVisibleCommercePrice(html, { productDetail: true });
  assert.equal(ranked.ambiguous, false);
  assert.equal(ranked.candidate?.amount, 12995);
  const observation = await collectorFor(html).collect({ url: 'https://www.nike.in/nike-pegasus-42/p/26000203' });
  assert.equal(observation.checkout.finalTotal, 12995);
  assert.equal(observation.currency, 'INR');
});

test('explicit visible selling price overrides stale structured data', async () => {
  const html = `
    <html><head><title>Nike Pegasus 42</title>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Old recommendation","offers":{"@type":"Offer","price":"500","priceCurrency":"INR"}}</script>
    </head><body>
      <h1>Nike Pegasus 42 Men's Road-Running Shoes</h1>
      <p>Get ₹500 off when you spend ₹5,000.</p>
      <div>Selling price ₹12,995</div>
    </body></html>`;

  const observation = await collectorFor(html).collect({ url: 'https://www.nike.in/product/pegasus-42' });
  assert.equal(observation.checkout.finalTotal, 12995);
  assert.equal(observation.currency, 'INR');
  assert.match(observation.collectorVersion, /visible-price-reconciled/);
});

test('discounted selling price wins over MRP/actual price', async () => {
  const html = '<html><head><title>Shoe</title></head><body><div>Selling price ₹8,241</div><div>Actual price ₹9,695</div><div>15% off</div></body></html>';
  const observation = await collectorFor(html).collect({ url: 'https://shop.example/shoe' });
  assert.equal(observation.checkout.finalTotal, 8241);
});

test('promo-only currency text is not sealed as a product price', async () => {
  const html = '<html><head><title>Product</title></head><body><p>Get ₹500 off with code SAVE500</p><h1>Product</h1></body></html>';
  const collector = collectorFor(html);
  await assert.rejects(
    () => collector.collect({ url: 'https://shop.example/product' }),
    (error) => error?.code === 'unsupported_page' && /promotional currency amounts/i.test(error.message),
  );
});

test('catalog pages with multiple equally credible product prices fail closed', async () => {
  const html = '<html><head><title>Shoes</title></head><body><div>Selling price ₹12,295</div><div>Selling price ₹13,295</div><div>Selling price ₹9,695</div></body></html>';
  const collector = collectorFor(html);
  await assert.rejects(
    () => collector.collect({ url: 'https://www.nike.in/men/shoes' }),
    (error) => error?.code === 'ambiguous_page' && /product-detail URL/i.test(error.message),
  );
});

test('live public collector refuses synthetic mutation/heal paths', async () => {
  const html = '<html><head><title>Shoe</title></head><body><p>Selling price ₹12,295</p></body></html>';
  const collector = collectorFor(html);
  await assert.rejects(
    () => collector.collect({ url: 'https://shop.example/shoe', mutation: 'wrong-valid-total' }),
    (error) => error?.code === 'unsupported_mode' && /does not synthesize/i.test(error.message),
  );
  await assert.rejects(
    () => collector.heal({ mutation: 'wrong-valid-total', prompt: 'repair' }),
    (error) => error?.code === 'unsupported_mode' && /Bright Data live workflow/i.test(error.message),
  );
});
