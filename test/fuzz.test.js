import test from 'node:test';
import assert from 'node:assert/strict';
import { healthyObservation } from '../src/fixtures/observations.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';

function rng(seed = 0xC0FFEE) {
  let x = seed >>> 0;
  return () => { x = (1664525 * x + 1013904223) >>> 0; return x / 0x100000000; };
}

test('500 deterministic monetary combinations pass when consistent and fail when total is corrupted', () => {
  const random = rng();
  for (let i = 0; i < 500; i++) {
    const base = 1000 + Math.floor(random() * 50000);
    const fee1 = Math.floor(random() * 2500);
    const fee2 = Math.floor(random() * 1200);
    const taxes = Math.floor(random() * 6000);
    const addons = Math.floor(random() * 1500);
    const discounts = Math.min(base, Math.floor(random() * 3000));
    const obs = healthyObservation();
    obs.offer.advertisedPrice = base;
    obs.checkout = {
      basePrice: base,
      feeItems: [{label:'A', amount:fee1}, {label:'B', amount:fee2}],
      mandatoryFees: fee1 + fee2,
      taxes,
      optionalAddons: addons,
      discounts,
      finalTotal: base + fee1 + fee2 + taxes + addons - discounts
    };
    obs.journey = [
      {label:'Offer', url:obs.targetUrl, displayedPrice:base, evidenceId:'ev_1'},
      {label:'Checkout', url:obs.targetUrl, displayedPrice:obs.checkout.finalTotal, evidenceId:'ev_4'}
    ];
    assert.equal(evaluateIntegrity(compileDealContract(obs)).status, 'valid', `healthy fuzz case ${i}`);
    obs.checkout.finalTotal += 1;
    const broken = evaluateIntegrity(compileDealContract(obs));
    assert.equal(broken.status, 'invalid', `corrupt fuzz case ${i}`);
    assert.ok(broken.failures.some((x) => x.id === 'total_arithmetic'));
  }
});
