import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { WebReceiptService } from '../src/services/orchestrator.js';

const parserUrl = new URL('../brightdata/parser.js', import.meta.url);
const interactionUrl = new URL('../brightdata/interaction.js', import.meta.url);

function node(text = '', attrs = {}) {
  return { __text: String(text), __attrs: { ...attrs } };
}

function parserDollar(table) {
  return function dollar(selectorOrElement) {
    const values = typeof selectorOrElement === 'object' && selectorOrElement !== null
      ? [selectorOrElement]
      : Array.isArray(table[selectorOrElement])
        ? table[selectorOrElement]
        : table[selectorOrElement] == null
          ? []
          : [table[selectorOrElement]];

    const normalized = values.map((value) => (
      typeof value === 'object' && value !== null ? value : node(value)
    ));
    const firstValue = normalized[0] ?? node('');
    const wrap = (value) => ({
      text_sane: () => String(value?.__text ?? ''),
      attr: (name) => String(value?.__attrs?.[name] ?? ''),
    });

    return {
      first: () => wrap(firstValue),
      text_sane: () => String(firstValue?.__text ?? ''),
      attr: (name) => String(firstValue?.__attrs?.[name] ?? ''),
      toArray: () => normalized,
    };
  };
}

async function runParser(table) {
  const source = await readFile(parserUrl, 'utf8');
  const parser = {
    offer_screenshot: { remote_url: 'https://evidence.example/product.png' },
  };
  return new Function('$', 'parser', 'location', source)(
    parserDollar(table),
    parser,
    { href: 'https://shop.example/products/nike-pegasus' },
  );
}

test('generic Scraper Studio parser prefers product price over an earlier shipping amount without fabricating checkout', async () => {
  const record = await runParser({
    h1: 'Nike Pegasus 41',
    body: 'Nike Pegasus 41. Shipping ₹500. Product price ₹12,999. Returns accepted within 30 days.',
    '[data-testid*="price"]': [
      node('₹500', { 'data-testid': 'shipping-price', class: 'price shipping-fee' }),
      node('₹12,999', { 'data-testid': 'product-price', class: 'price product-price' }),
    ],
  });

  assert.equal(record.recordType, 'product_observation');
  assert.equal(record.subject, 'Nike Pegasus 41');
  assert.equal(record.currency, 'INR');
  assert.equal(record.commercial.productPrice, 12999);
  assert.equal(record.commercial.shippingFee, 500);
  assert.equal(record.offer.advertisedPrice, 12999);
  assert.equal(record.checkout, undefined);
  assert.equal(record.commercial.finalTotal, undefined);
  assert.equal(record.collectorVersion, 'webreceipt-custom-commerce-v3');
  const productPriceEvidence = record.evidence.find((item) => item.field === 'commercial.productPrice');
  assert.match(productPriceEvidence.capturedText, /12,999/);
  assert.doesNotMatch(productPriceEvidence.capturedText, /^₹500$/);
});

test('semantic price selection works from visible text without site-specific selectors', async () => {
  const record = await runParser({
    h1: 'Running shoe',
    body: `Delivery ₹500 ${'details '.repeat(30)} Product price ₹12,999. Return policy: 30 days.`,
  });

  assert.equal(record.recordType, 'product_observation');
  assert.equal(record.commercial.productPrice, 12999);
  assert.equal(record.commercial.shippingFee, 500);
  assert.equal(record.currency, 'INR');
  assert.equal(record.checkout, undefined);
  assert.equal(record.evidence.find((item) => item.field === 'commercial.productPrice').domPath, 'visible text');
});

test('JSON-LD product offer beats a shipping price object that appears first', async () => {
  const record = await runParser({
    h1: 'Nike Pegasus 41',
    body: 'Nike Pegasus 41. Returns available.',
    'script[type="application/ld+json"]': [
      node(JSON.stringify({
        shippingDetails: { price: 500, priceCurrency: 'INR' },
        '@type': 'Product',
        name: 'Nike Pegasus 41',
        offers: { '@type': 'Offer', price: 12999, priceCurrency: 'INR' },
      })),
    ],
  });

  assert.equal(record.recordType, 'product_observation');
  assert.equal(record.commercial.productPrice, 12999);
  assert.equal(record.commercial.shippingFee, 500);
  assert.equal(record.currency, 'INR');
  assert.equal(record.checkout, undefined);
  assert.equal(record.evidence.find((item) => item.field === 'commercial.productPrice').domPath, 'script[type="application/ld+json"]');
});

test('product page does not claim a final total unless final-total semantics are explicitly evidenced', async () => {
  const withoutTotal = await runParser({
    h1: 'Running shoe',
    body: 'Product price ₹12,999. Delivery ₹500.',
  });
  assert.equal(withoutTotal.commercial.productPrice, 12999);
  assert.equal(withoutTotal.commercial.shippingFee, 500);
  assert.equal(withoutTotal.commercial.finalTotal, undefined);

  const withTotal = await runParser({
    h1: 'Running shoe',
    body: `Product price ₹12,999 ${'details '.repeat(30)} Order total ₹13,499.`,
  });
  assert.equal(withTotal.commercial.productPrice, 12999);
  assert.equal(withTotal.commercial.finalTotal, 13499);
  assert.equal(withTotal.checkout, undefined);
  assert.ok(withTotal.evidence.some((item) => item.field === 'commercial.finalTotal'));
});

test('service returns a valid partial product observation without sealing a Deal Contract or requesting repair', async () => {
  const raw = await runParser({
    h1: 'Nike Pegasus 41',
    body: 'Nike Pegasus 41. Shipping ₹500. Product price ₹12,999.',
    '[data-testid*="price"]': [
      node('₹500', { 'data-testid': 'shipping-price', class: 'price shipping-fee' }),
      node('₹12,999', { 'data-testid': 'product-price', class: 'price product-price' }),
    ],
  });

  let healCalls = 0;
  let contractWrites = 0;
  const events = [];
  const collector = {
    kind: 'brightdata',
    collectorId: 'c_semantic_test',
    collect: async () => raw,
    heal: async () => {
      healCalls += 1;
      throw new Error('self-heal should not run for an honest offer-only observation');
    },
  };
  const store = {
    state: { contracts: [] },
    event: async (...args) => { events.push(args); },
    addContract: async () => { contractWrites += 1; },
  };
  const service = new WebReceiptService({ collector, store });
  const result = await service.observe({
    targetUrl: 'https://shop.example/products/nike-pegasus',
    autoHeal: true,
  });

  assert.equal(result.recordType, 'product_observation');
  assert.equal(result.contract, null);
  assert.equal(result.sealable, false);
  assert.equal(result.integrity.status, 'partial');
  assert.equal(result.integrity.sealable, false);
  assert.equal(result.commercial.productPrice, 12999);
  assert.equal(result.commercial.shippingFee, 500);
  assert.equal(result.commercial.finalTotal, undefined);
  assert.equal(result.observation.collectorId, 'c_semantic_test');
  assert.equal(healCalls, 0);
  assert.equal(contractWrites, 0);
  assert.ok(events.some((entry) => entry[0] === 'observe'));
});

test('live product support is semantic rather than hardcoded to the regression amounts', async () => {
  const parserSource = await readFile(parserUrl, 'utf8');
  const interactionSource = await readFile(interactionUrl, 'utf8');
  const executableParserSource = parserSource
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

  assert.doesNotMatch(executableParserSource, /12999|12,999|\b500\b/);
  assert.match(parserSource, /shipping\|delivery\|postage\|freight/);
  assert.match(parserSource, /product\|item/);
  assert.match(parserSource, /recordType: 'product_observation'/);
  assert.match(interactionSource, /must not fabricate checkout fields/);
  assert.match(interactionSource, /controlledFixture/);
});
