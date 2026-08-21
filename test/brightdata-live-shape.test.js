import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBrightDataRecord } from '../src/integrations/brightdata-normalize.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';

const TARGET = 'https://web-receipt-tawny.vercel.app/fixture/hotel';

export function realFlatV1() {
  return {
    advertised_price: { value: 8499, currency: 'INR', symbol: '₹' },
    base_price: { value: 8499, currency: 'INR', symbol: '₹' },
    property_fee: { value: 499, currency: 'INR', symbol: '₹' },
    service_fee: { value: 349, currency: 'INR', symbol: '₹' },
    tax: { value: 800, currency: 'INR', symbol: '₹' },
    order_total: { value: 10147, currency: 'INR', symbol: '₹' },
    cancellation_terms: 'Cancellation: Free cancellation until 21 Aug',
    refundability: 'Refundability: Refundable',
    payment_timing: 'Payment: Pay now',
    inclusions: 'Includes: Breakfast',
    offer_name: 'Ocean House · Deluxe Room',
    journey_state: 'Step 3 of 3 · Final amount reviewed',
    input: { url: TARGET },
  };
}

test('real generated collector flat V1 output compiles into a valid Deal Contract', () => {
  const observation = normalizeBrightDataRecord(realFlatV1(), {
    targetUrl: TARGET,
    collectorId: 'c_mt3ha1iv1jgm8eg813',
  });
  const contract = compileDealContract(observation);
  const integrity = evaluateIntegrity(contract);
  assert.equal(contract.subject, 'Ocean House · Deluxe Room');
  assert.equal(contract.offer.advertisedPrice.amount, 8499);
  assert.equal(contract.checkout.mandatoryFees.amount, 848);
  assert.equal(contract.checkout.taxes.amount, 800);
  assert.equal(contract.checkout.finalTotal.amount, 10147);
  assert.equal(contract.terms.cancellation, 'Free cancellation until 21 Aug');
  assert.equal(contract.terms.refundability, 'Refundable');
  assert.equal(contract.terms.paymentTiming, 'Pay now');
  assert.deepEqual(contract.terms.inclusions, ['Breakfast']);
  assert.equal(contract.journey.at(-1).label, 'Step 3 of 3 · Final amount reviewed');
  assert.equal(integrity.status, 'valid');
  assert.equal(integrity.failures.length, 0);
});

test('normalizer preserves already-canonical Scraper Studio output', () => {
  const canonical = {
    subject: 'Canonical', targetUrl: TARGET, offer: {}, checkout: {}, terms: {},
  };
  const normalized = normalizeBrightDataRecord(canonical, { collectorId: 'c_demo' });
  assert.equal(normalized.subject, 'Canonical');
  assert.equal(normalized.collectorId, 'c_demo');
});

test('real parse_error output fails clearly instead of becoming a fake receipt', () => {
  assert.throws(() => normalizeBrightDataRecord({
    input: { url: TARGET },
    error: 'Parse error: value must be finite number',
    error_code: 'parse_error',
  }, { targetUrl: TARGET, collectorId: 'c_mt3ha1iv1jgm8eg813' }), /collector output error \(parse_error\).*finite number/i);
});

test('flat output with a missing required monetary field fails closed', () => {
  const row = realFlatV1();
  delete row.order_total;
  assert.throws(() => normalizeBrightDataRecord(row, { targetUrl: TARGET }), /invalid order_total/i);
});
