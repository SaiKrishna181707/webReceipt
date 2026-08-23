import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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

test('generic Scraper Studio parser prefers product price over an earlier shipping amount', async () => {
  const record = await runParser({
    h1: 'Nike Pegasus 41',
    body: 'Nike Pegasus 41. Shipping ₹500. Product price ₹12,999. Returns accepted within 30 days.',
    '[data-testid*="price"]': [
      node('₹500', { 'data-testid': 'shipping-price', class: 'price shipping-fee' }),
      node('₹12,999', { 'data-testid': 'product-price', class: 'price product-price' }),
    ],
  });

  assert.equal(record.subject, 'Nike Pegasus 41');
  assert.equal(record.currency, 'INR');
  assert.equal(record.offer.advertisedPrice, 12999);
  assert.equal(record.checkout.basePrice, 12999);
  assert.equal(record.checkout.finalTotal, 12999);
  assert.equal(record.collectorVersion, 'webreceipt-custom-commerce-v2');
  assert.match(record.evidence.find((item) => item.field === 'offer.advertisedPrice').capturedText, /12,999/);
  assert.doesNotMatch(record.evidence.find((item) => item.field === 'offer.advertisedPrice').capturedText, /^₹500$/);
});

test('semantic price selection works from visible text without site-specific selectors', async () => {
  const record = await runParser({
    h1: 'Running shoe',
    body: `Delivery ₹500 ${'details '.repeat(30)} Product price ₹12,999. Return policy: 30 days.`,
  });

  assert.equal(record.offer.advertisedPrice, 12999);
  assert.equal(record.currency, 'INR');
  assert.equal(record.evidence[0].domPath, 'visible text');
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

  assert.equal(record.offer.advertisedPrice, 12999);
  assert.equal(record.currency, 'INR');
  assert.equal(record.evidence[0].domPath, 'script[type="application/ld+json"]');
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
  assert.match(interactionSource, /Generic public product page/);
  assert.match(interactionSource, /controlledFixture/);
});
