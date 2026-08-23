import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderHotelFixture } from '../src/fixture-page.js';
import { renderProductFixture } from '../src/product-fixture-page.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';

const interactionUrl = new URL('../brightdata/interaction.js', import.meta.url);
const parserUrl = new URL('../brightdata/parser.js', import.meta.url);
const inputSchemaUrl = new URL('../brightdata/input-schema.json', import.meta.url);
const schemaUrl = new URL('../brightdata/output-schema.json', import.meta.url);
const read = (url) => readFile(url, 'utf8');

test('custom Scraper Studio interaction is a real public-only Browser Worker journey', async () => {
  const source = await read(interactionUrl);
  new Function(source);
  for (const primitive of ['navigate(', 'wait_visible(', 'click(', 'wait_network_idle(', 'wait_page_idle(', 'tag_screenshot(', 'parse()', 'collect(']) {
    assert.ok(source.includes(primitive), primitive);
  }
  assert.match(source, /continue-to-checkout/);
  assert.match(source, /offer_screenshot/);
  assert.match(source, /checkout_screenshot/);
  assert.match(source, /credential-free HTTP\(S\)/);
  assert.match(source, /login\/private paths/);
  assert.match(source, /publicly reachable hosts/);
  assert.match(source, /isPrivateHost/);
  assert.match(source, /decodeURIComponent/);
});

test('custom parser preserves the deliberate wrong-but-valid semantic failure and favors remotely usable screenshots', async () => {
  const source = await read(parserUrl);
  new Function(source);
  assert.match(source, /money\('\.total-price'\)/);
  assert.doesNotMatch(source, /finalTotal\s*=\s*money\('\[data-testid="order-total"\]'\)/);
  assert.match(source, /remote_url \|\| value\.url \|\| value\.file_path/);
  assert.match(source, /offer-name/);
});

test('controlled hotel fixture requires a click and V2 changes meaning + DOM shape simultaneously', () => {
  const v1 = renderHotelFixture('v1');
  const v2 = renderHotelFixture('v2');
  assert.match(v1, /data-testid="checkout-panel" hidden/);
  assert.match(v1, /data-testid="continue-to-checkout"/);
  assert.match(v1, /class="total-price" data-testid="order-total">₹10,147/);
  assert.match(v2, /class="total-price">₹8,499/);
  assert.match(v2, /data-testid="order-total"[^>]*>.*currency-symbol.*₹.*major.*10,147/s);
});

test('controlled product fixture performs a real DOM semantic-role redesign', () => {
  const v1 = renderProductFixture('v1');
  const v2 = renderProductFixture('v2');
  assert.match(v1, /WebReceipt-controlled public product fixture/);
  assert.match(v1, /data-testid="advertised-price">₹12,999/);
  assert.match(v1, /class="total-price" data-testid="order-total">₹13,499/);
  assert.match(v2, /redesigned-product-price/);
  assert.match(v2, /Product price<\/span><strong class="total-price">₹12,999/);
  assert.match(v2, /data-testid="order-total"[^>]*>.*Final total.*13,499/s);
});

test('Scraper Studio input schema requires one public URL and output schema requires critical evidence fields', async () => {
  const input = JSON.parse(await read(inputSchemaUrl));
  assert.equal(input.type, 'object');
  assert.equal(input.fields.url.type, 'url');
  assert.equal(input.fields.url.required, true);

  const schema = JSON.parse(await read(schemaUrl));
  assert.equal(schema.type, 'object');
  assert.equal(schema.fields.checkout.fields.finalTotal.required, true);
  assert.equal(schema.fields.commercial.fields.productPrice.required, true);
  assert.equal(schema.fields.commercial.fields.finalTotal.required, false);
  assert.equal(schema.fields.terms.fields.cancellation.required, true);
  assert.equal(schema.fields.evidence.items.fields.sourceUrl.required, true);
  assert.equal(schema.fields.subject.pii, false);
});

function parserDollar(table) {
  return function dollar(selectorOrElement) {
    const values = typeof selectorOrElement === 'object' && selectorOrElement !== null
      ? [selectorOrElement.__text ?? '']
      : Array.isArray(table[selectorOrElement]) ? table[selectorOrElement] : [table[selectorOrElement] ?? ''];
    const text = () => String(values[0] ?? '');
    return {
      first: () => ({ text_sane: text, attr: () => '' }),
      text_sane: text,
      attr: () => '',
      toArray: () => values.filter((value) => value != null && value !== '').map((value) => ({ __text: String(value) })),
    };
  };
}

async function executeCheckedInParser(overrides = {}, href = 'https://public.example/fixture/hotel') {
  const source = await read(parserUrl);
  const table = {
    '[data-testid="offer-name"]': 'Ocean House · 1 night · Deluxe Room',
    '[data-testid="advertised-price"]': '₹8,499.00',
    '[data-testid="base-price"]': 'INR 8,499.00',
    '.fee-property': '₹499',
    '.fee-service': '₹349',
    '[data-testid="tax"]': '₹800.00',
    '.total-price': '₹10,147.00',
    '.legacy': '',
    '.claim': ['Free cancellation', 'Breakfast included'],
    '#cancellation': 'Cancellation: Free cancellation until 21 Aug',
    '#refundability': 'Refundability: Refundable',
    '#payment-timing': 'Payment: Pay now',
    '#inclusions': 'Includes: Breakfast',
    ...overrides,
  };
  const parser = {
    offer_screenshot: {remote_url:'https://evidence.example/offer.png'},
    checkout_screenshot: {remote_url:'https://evidence.example/checkout.png'},
  };
  return new Function('$', 'parser', 'location', source)(parserDollar(table), parser, {href});
}

async function executeProductCheckedInParser(overrides = {}) {
  return executeCheckedInParser({
    '[data-testid="offer-name"]': 'Nike Pegasus 41 · Men\'s Road-Running Shoes',
    '[data-testid="advertised-price"]': '₹12,999',
    '[data-testid="base-price"]': '₹12,999',
    '[data-testid="shipping-fee"]': '₹500',
    '[data-testid="other-fee"]': '₹0',
    '[data-testid="product-brand"]': 'Nike',
    '[data-testid="product-model"]': 'Pegasus 41',
    '[data-testid="product-sku"]': 'WR-PEGASUS-41',
    '[data-testid="tax"]': '₹0',
    '.total-price': '₹13,499',
    '.claim': ['In stock', '30-day returns'],
    '#cancellation': 'Cancellation: Allowed before dispatch',
    '#refundability': 'Refundability: 30-day returns',
    '#payment-timing': 'Payment: No payment required in demo',
    '#inclusions': 'Includes: Nike Pegasus 41 shoes',
    ...overrides,
  }, 'https://public.example/fixture/product');
}

test('checked-in Scraper Studio parser normalizes realistic money formats on hotel V1', async () => {
  const record = await executeCheckedInParser();
  assert.equal(record.offer.advertisedPrice, 8499);
  assert.equal(record.checkout.basePrice, 8499);
  assert.equal(record.checkout.mandatoryFees, 848);
  assert.equal(record.checkout.taxes, 800);
  assert.equal(record.checkout.finalTotal, 10147);
  assert.equal(record.evidence.find((e) => e.field === 'checkout.finalTotal').screenshotRef, 'https://evidence.example/checkout.png');
});

test('checked-in parser exhibits the intended hotel V2 silent semantic drift and the real integrity engine catches it', async () => {
  const record = await executeCheckedInParser({
    '.total-price': '₹8,499',
    '.legacy': 'Subtotal ₹8,499',
    '[data-testid="order-total"]': '₹10,147',
  });
  assert.equal(record.checkout.finalTotal, 8499, 'legacy selector still returns a plausible number');
  const contract = compileDealContract(record);
  const integrity = evaluateIntegrity(contract);
  assert.equal(integrity.status, 'invalid');
  assert.ok(integrity.failures.some((failure) => failure.id === 'total_arithmetic'));
});

test('SAME checked-in Scraper Studio parser turns a legitimate product price into wrong final-total semantics after product V2 redesign', async () => {
  const v1 = await executeProductCheckedInParser();
  assert.equal(v1.recordType, 'deal_contract');
  assert.equal(v1.product.brand, 'Nike');
  assert.equal(v1.commercial.productPrice, 12999);
  assert.equal(v1.commercial.shippingFee, 500);
  assert.equal(v1.commercial.finalTotal, 13499);
  assert.equal(evaluateIntegrity(compileDealContract(v1)).status, 'valid');

  const v2 = await executeProductCheckedInParser({
    '.total-price': '₹12,999',
    '.legacy': 'Product price ₹12,999',
    '[data-testid="order-total"]': '₹13,499',
  });
  assert.equal(v2.commercial.productPrice, 12999);
  assert.equal(v2.commercial.finalTotal, 12999);
  const evidence = v2.evidence.find((item) => item.field === 'checkout.finalTotal');
  assert.equal(evidence.domPath, '.total-price');
  assert.match(evidence.capturedText, /Product price.*12,999/);
  const integrity = evaluateIntegrity(compileDealContract(v2));
  assert.equal(integrity.status, 'invalid');
  const arithmetic = integrity.failures.find((failure) => failure.id === 'total_arithmetic');
  assert.equal(arithmetic.details.expected, 13499);
  assert.equal(arithmetic.details.extracted, 12999);
});
