import test from 'node:test';
import assert from 'node:assert/strict';
import { stableStringify, sha256 } from '../src/domain/hash.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';
import { detectAnomalies } from '../src/domain/anomalies.js';
import { verifyReceiptBundle } from '../src/domain/verify.js';
import { diffContracts } from '../src/domain/diff.js';
import { assertPublicTarget } from '../src/domain/target-policy.js';
import { healthyObservation, mutationObservation, changedPromiseObservation } from '../src/fixtures/observations.js';

test('hashing is deterministic regardless of object key order', () => {
  assert.equal(stableStringify({b: 2, a: 1}), stableStringify({a: 1, b: 2}));
  assert.equal(sha256({b: 2, a: 1}), sha256({a: 1, b: 2}));
});

test('healthy observation compiles to a valid contract with re-verifiable hashes', () => {
  const contract = compileDealContract(healthyObservation());
  const integrity = evaluateIntegrity(contract);
  assert.equal(integrity.status, 'valid');
  assert.equal(integrity.passed, integrity.total);
  assert.match(contract.contractHash, /^[a-f0-9]{64}$/);
  assert.ok(contract.evidence.every((e) => /^[a-f0-9]{64}$/.test(e.hash)));
});

test('tampering with stored evidence is detected even when JSON remains structurally valid', () => {
  const contract = compileDealContract(healthyObservation());
  contract.evidence[0].capturedText = 'Edited after capture';
  const integrity = evaluateIntegrity(contract);
  assert.equal(integrity.status, 'invalid');
  const ids = integrity.failures.map((x) => x.id);
  assert.ok(ids.includes('evidence_hashes'));
  assert.ok(ids.includes('contract_hash'));
});

test('tampering only with the Deal Contract hash is detected', () => {
  const contract = compileDealContract(healthyObservation());
  contract.contractHash = '0'.repeat(64);
  const integrity = evaluateIntegrity(contract);
  assert.equal(integrity.status, 'invalid');
  assert.ok(integrity.failures.some((x) => x.id === 'contract_hash'));
});

test('malformed collector output fails closed during contract compilation', () => {
  assert.throws(() => compileDealContract({subject:'x'}), /required|targetUrl|checkout|observation/i);
  const obs = healthyObservation();
  obs.currency = 'NOT-MONEY';
  assert.throws(() => compileDealContract(obs), /currency/i);
  const bad = healthyObservation();
  bad.observedAt = 'yesterday-ish';
  assert.throws(() => compileDealContract(bad), /observedAt/i);
});

test('discounts are included in checkout arithmetic instead of causing false positives', () => {
  const obs = healthyObservation();
  obs.checkout.discounts = 500;
  obs.checkout.finalTotal = 9647;
  const contract = compileDealContract(obs);
  assert.equal(evaluateIntegrity(contract).status, 'valid');
});

test('wrong-but-valid total is detected semantically', () => {
  const contract = compileDealContract(mutationObservation('wrong-valid-total'));
  const integrity = evaluateIntegrity(contract);
  assert.equal(integrity.status, 'invalid');
  assert.ok(integrity.failures.some((x) => x.id === 'total_arithmetic'));
});

test('new mandatory fee causes both arithmetic and fee-breakdown failures', () => {
  const contract = compileDealContract(mutationObservation('new-mandatory-fee'));
  const ids = evaluateIntegrity(contract).failures.map((x) => x.id);
  assert.ok(ids.includes('total_arithmetic'));
  assert.ok(ids.includes('fee_breakdown'));
});

test('missing critical evidence is a hard integrity failure', () => {
  const contract = compileDealContract(mutationObservation('missing-evidence'));
  const integrity = evaluateIntegrity(contract);
  assert.equal(integrity.status, 'invalid');
  assert.ok(integrity.failures.some((x) => x.id === 'critical_evidence'));
});

test('anomaly detector handles free advertised offers without Infinity percentages', () => {
  const obs = healthyObservation();
  obs.offer.advertisedPrice = 0;
  const contract = compileDealContract(obs);
  const anomalies = detectAnomalies(contract);
  assert.ok(anomalies.some((x) => x.id === 'observed_price_increase'));
  assert.ok(anomalies.every((x) => !String(x.value).includes('Infinity')));
});

test('promise diff captures prices, fees, terms, claims and inclusions', () => {
  const before = compileDealContract(healthyObservation());
  const changed = changedPromiseObservation();
  changed.offer.claims = ['Breakfast costs extra'];
  changed.checkout.optionalAddons = 50;
  changed.checkout.finalTotal += 50;
  const after = compileDealContract(changed);
  const paths = diffContracts(before, after).map((x) => x.path);
  for (const expected of [
    'offer.advertisedPrice', 'offer.claims', 'checkout.mandatoryFees',
    'checkout.optionalAddons', 'checkout.finalTotal', 'terms.cancellation',
    'terms.inclusions', 'checkout.feeItems.Property fee'
  ]) assert.ok(paths.includes(expected), expected);
});

test('public-target policy rejects credentials, private networks and exact private path segments without false positives', () => {
  assert.equal(assertPublicTarget('https://example.com/hotels/room#frag'), 'https://example.com/hotels/room');
  assert.match(assertPublicTarget('https://example.com/accounting/report'), /^https:/, 'accounting must not be confused with /account');
  assert.throws(() => assertPublicTarget('ftp://example.com/file'));
  assert.throws(() => assertPublicTarget('https://user:pass@example.com/room'));
  assert.throws(() => assertPublicTarget('https://example.com/account/bookings'));
  assert.throws(() => assertPublicTarget('https://example.com/%2561ccount/bookings'), /public anonymous/);
  assert.throws(() => assertPublicTarget('http://127.0.0.1:3000/fixture/hotel'), /publicly reachable/);
  assert.throws(() => assertPublicTarget('http://100.64.0.1/'), /publicly reachable/);
  assert.throws(() => assertPublicTarget('http://[::1]/'), /publicly reachable/);
  assert.throws(() => assertPublicTarget('http://[fc00::1]/'), /publicly reachable/);
  assert.throws(() => assertPublicTarget('http://[::ffff:127.0.0.1]/'), /publicly reachable/);
  assert.match(assertPublicTarget('http://127.0.0.1:3000/fixture/hotel', {allowLocal:true}), /^http:/);
});

test('portable receipt verifier independently recomputes integrity instead of trusting stored verdicts', () => {
  const contract = compileDealContract(healthyObservation());
  const healthy = verifyReceiptBundle({contract, integrity:{status:'fake-old-verdict'}});
  assert.equal(healthy.valid, true);
  assert.equal(healthy.integrity.status, 'valid');

  const tampered = structuredClone(contract);
  tampered.evidence[0].capturedText = 'changed after export';
  const checked = verifyReceiptBundle({contract:tampered, integrity:{status:'valid'}});
  assert.equal(checked.valid, false);
  assert.ok(checked.integrity.failures.some((failure) => failure.id === 'evidence_hashes'));
});
