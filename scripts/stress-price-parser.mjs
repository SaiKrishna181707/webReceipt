import assert from 'node:assert/strict';
import { selectVisibleCommercePrice } from '../src/integrations/commerce-price.js';

let seed = 0x5eed1234;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
}
function integer(min, max) { return Math.floor(random() * (max - min + 1)) + min; }
function pick(values) { return values[Math.floor(random() * values.length)]; }
function formatInr(value) { return `₹${value.toLocaleString('en-IN')}`; }

const labels = ['Selling price', 'Sale price', 'Current price', 'Deal price', 'Special price'];
const promoLabels = ['Get', 'Save', 'Extra', 'Cashback'];
const noise = [
  'Free delivery on eligible orders.',
  'Select your size before checkout.',
  'Member benefits apply at checkout.',
  'Taxes may vary by destination.',
  'Limited stock available.',
];

const CASES = 6000;
for (let i = 0; i < CASES; i++) {
  const selling = integer(1500, 35000);
  const original = selling + integer(100, 6000);
  const promo = integer(50, Math.max(50, Math.min(1500, selling - 1)));
  const label = pick(labels);
  const promoLabel = pick(promoLabels);
  const blocks = [
    `<p>${promoLabel} ${formatInr(promo)} off with code SAVE${integer(10, 99)}</p>`,
    `<div>${label} ${formatInr(selling)}</div>`,
    `<div>Actual price ${formatInr(original)}</div>`,
    `<small>${pick(noise)}</small>`,
    `<small>Free shipping on orders over ${formatInr(selling + integer(1000, 7000))}</small>`,
    `<small>EMI ${formatInr(Math.max(1, Math.round(selling / 12)))}/month</small>`,
  ];
  if (random() < 0.5) blocks.reverse();
  else if (random() < 0.5) [blocks[0], blocks[1]] = [blocks[1], blocks[0]];
  const html = `<html><body><h1>Product ${i}</h1>${blocks.join(' ')}</body></html>`;
  const ranked = selectVisibleCommercePrice(html);
  assert.equal(ranked.ambiguous, false, `case ${i} unexpectedly ambiguous`);
  assert.equal(ranked.candidate?.amount, selling, `case ${i} selected ${ranked.candidate?.amount} instead of ${selling}`);
  assert.equal(ranked.candidate?.currency, 'INR', `case ${i} wrong currency`);
}

const PRODUCT_DETAIL_CASES = 2000;
for (let i = 0; i < PRODUCT_DETAIL_CASES; i++) {
  const selling = integer(2500, 40000);
  const promo = integer(50, Math.min(1200, selling - 1));
  const shipping = integer(50, 900);
  let recA = integer(1500, 45000);
  let recB = integer(1500, 45000);
  if (recA === selling) recA += 17;
  if (recB === selling || recB === recA) recB += 29;
  const html = `<html><body>
    <p>Get ${formatInr(promo)} off with code RUN${integer(10, 99)}</p>
    <h1>Nike-style product ${i}</h1>
    <p>Shipping ${formatInr(shipping)}</p>
    <div>${formatInr(selling)}</div>
    <p>Inclusive of all taxes</p>
    <section>You might also like <span>${formatInr(recA)}</span> <span>${formatInr(recB)}</span></section>
  </body></html>`;
  const ranked = selectVisibleCommercePrice(html, { productDetail: true });
  assert.equal(ranked.ambiguous, false, `product detail case ${i} unexpectedly ambiguous`);
  assert.equal(ranked.candidate?.amount, selling, `product detail case ${i} selected ${ranked.candidate?.amount} instead of ${selling}`);
  assert.equal(ranked.candidate?.currency, 'INR', `product detail case ${i} wrong currency`);
}

for (let i = 0; i < 800; i++) {
  const first = integer(2000, 30000);
  let second = integer(2000, 30000);
  if (second === first) second += 1;
  const html = `<html><body><div>Selling price ${formatInr(first)}</div><div>Selling price ${formatInr(second)}</div></body></html>`;
  const ranked = selectVisibleCommercePrice(html);
  assert.equal(ranked.ambiguous, true, `ambiguous case ${i} was not rejected`);
}

console.log(`Commerce price stress: PASS (${CASES + PRODUCT_DETAIL_CASES + 800} deterministic clutter/product-detail/ambiguity cases)`);
