import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderHotelFixture } from '../src/fixture-page.js';

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

test('controlled public fixture requires a click and V2 changes meaning + DOM shape simultaneously', () => {
  const v1 = renderHotelFixture('v1');
  const v2 = renderHotelFixture('v2');
  assert.match(v1, /data-testid="checkout-panel" hidden/);
  assert.match(v1, /data-testid="continue-to-checkout"/);
  assert.match(v1, /class="total-price" data-testid="order-total">₹10,147/);
  assert.match(v2, /class="total-price">₹8,499/);
  assert.match(v2, /data-testid="order-total"[^>]*>.*currency-symbol.*₹.*major.*10,147/s);
});

test('Scraper Studio input schema requires one public URL and output schema requires critical evidence fields', async () => {
  const input = JSON.parse(await read(inputSchemaUrl));
  assert.equal(input.type, 'object');
  assert.equal(input.fields.url.type, 'url');
  assert.equal(input.fields.url.required, true);


  const schema = JSON.parse(await read(schemaUrl));
  assert.equal(schema.type, 'object');
  assert.equal(schema.fields.checkout.fields.finalTotal.required, true);
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
      first: () => ({ text_sane: text }),
      text_sane: text,
      toArray: () => values.filter((value) => value != null && value !== '').map((value) => ({ __text: String(value) })),
    };
  };
}

async function executeCheckedInParser(overrides = {}) {
  const source = await read(parserUrl);
  const table = {
    '[data-testid="offer-name"]': 'Ocean House · 1 night · Deluxe Room',
    '[data-testid="advertised-price"]': '₹8,499.00',
    '[data-testid="base-price"]': 'INR 8,499.00',
    '.fee-property': '₹499',
    '.fee-service': '₹349',
    '[data-testid="tax"]': '₹800.00',
    '.total-price': '₹10,147.00',
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
  return new Function('$', 'parser', 'location', source)(parserDollar(table), parser, {href:'https://public.example/fixture/hotel'});
}

test('checked-in Scraper Studio parser normalizes realistic money formats on V1', async () => {
  const record = await executeCheckedInParser();
  assert.equal(record.offer.advertisedPrice, 8499);
  assert.equal(record.checkout.basePrice, 8499);
  assert.equal(record.checkout.mandatoryFees, 848);
  assert.equal(record.checkout.taxes, 800);
  assert.equal(record.checkout.finalTotal, 10147);
  assert.equal(record.evidence.find((e) => e.field === 'checkout.finalTotal').screenshotRef, 'https://evidence.example/checkout.png');
});

test('checked-in parser exhibits the intended V2 silent semantic drift and the real integrity engine catches it', async () => {
  const { compileDealContract } = await import('../src/domain/contract.js');
  const { evaluateIntegrity } = await import('../src/domain/integrity.js');
  const record = await executeCheckedInParser({
    '.total-price': 'Subtotal ₹8,499',
    '[data-testid="order-total"]': '₹10,147',
  });
  assert.equal(record.checkout.finalTotal, 8499, 'legacy selector still returns a plausible number');
  const contract = compileDealContract(record);
  const integrity = evaluateIntegrity(contract);
  assert.equal(integrity.status, 'invalid');
  assert.ok(integrity.failures.some((failure) => failure.id === 'total_arithmetic'));
});
