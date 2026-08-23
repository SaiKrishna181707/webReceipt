import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const consoleSource = fs.readFileSync(new URL('../app/console/page.tsx', import.meta.url), 'utf8');
const fixtureSource = fs.readFileSync(new URL('../src/product-fixture-page.js', import.meta.url), 'utf8');

test('fresh console is generic, empty, and separates live observation from the drift lab', () => {
  assert.match(consoleSource, /useState\(''\)/, 'console URL must start empty');
  assert.match(consoleSource, /Live observation/i);
  assert.match(consoleSource, /Semantic drift lab/i);
  assert.match(consoleSource, /Scrape/);
  assert.match(consoleSource, /Extract/);
  assert.match(consoleSource, /Structure/);
  assert.match(consoleSource, /Verify/);
  assert.match(consoleSource, /Record/);
  assert.doesNotMatch(consoleSource, /https:\/\/web-receipt-tawny\.vercel\.app/i);
  assert.doesNotMatch(consoleSource, /Nike|Amazon/i, 'retailers must not be console product identity');
});

test('controlled semantic-drift fixture is retailer-neutral', () => {
  assert.match(fixtureSource, /WebReceipt-controlled public product fixture/);
  assert.match(fixtureSource, /Example Store/);
  assert.doesNotMatch(fixtureSource, /Nike|Amazon/i);
  assert.match(fixtureSource, /class="total-price">₹12,999/);
  assert.match(fixtureSource, /data-testid="order-total"/);
});
