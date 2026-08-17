import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderHotelFixture } from '../src/fixture-page.js';

const interactionUrl = new URL('../brightdata/interaction.js', import.meta.url);
const parserUrl = new URL('../brightdata/parser.js', import.meta.url);
const schemaUrl = new URL('../brightdata/output-schema.json', import.meta.url);

const read = (url) => readFile(url, 'utf8');

test('custom Scraper Studio interaction is a real Browser Worker journey', async () => {
  const source = await read(interactionUrl);
  new Function(source);
  for (const primitive of ['navigate(', 'wait_visible(', 'click(', 'wait_network_idle(', 'wait_page_idle(', 'tag_screenshot(', 'parse()', 'collect(']) {
    assert.ok(source.includes(primitive), primitive);
  }
  assert.match(source, /continue-to-checkout/);
  assert.match(source, /offer_screenshot/);
  assert.match(source, /checkout_screenshot/);
});

test('custom parser preserves the deliberate wrong-but-valid semantic failure', async () => {
  const source = await read(parserUrl);
  new Function(source);
  assert.match(source, /money\('\.total-price'\)/);
  assert.doesNotMatch(source, /finalTotal\s*=\s*money\('\[data-testid="order-total"\]'\)/);
});

test('controlled public fixture requires a click and keeps legacy selector alive with changed meaning', () => {
  const v1 = renderHotelFixture('v1');
  const v2 = renderHotelFixture('v2');
  assert.match(v1, /data-testid="checkout-panel" hidden/);
  assert.match(v1, /data-testid="continue-to-checkout"/);
  assert.match(v1, /class="total-price" data-testid="order-total">₹10,147/);
  assert.match(v2, /class="total-price">₹8,499/);
  assert.match(v2, /data-testid="order-total">₹10,147/);
});

test('Scraper Studio output schema requires critical contract/evidence fields and contains no PII flag', async () => {
  const schema = JSON.parse(await read(schemaUrl));
  assert.equal(schema.type, 'object');
  assert.equal(schema.fields.checkout.fields.finalTotal.required, true);
  assert.equal(schema.fields.terms.fields.cancellation.required, true);
  assert.equal(schema.fields.evidence.items.fields.sourceUrl.required, true);
  assert.equal(schema.fields.subject.pii, false);
});
