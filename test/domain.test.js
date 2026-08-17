import test from 'node:test';
import assert from 'node:assert/strict';
import { stableStringify, sha256 } from '../src/domain/hash.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';
import { diffContracts } from '../src/domain/diff.js';
import { assertPublicTarget } from '../src/domain/target-policy.js';
import { healthyObservation, mutationObservation, changedPromiseObservation } from '../src/fixtures/observations.js';

test('hashing is deterministic regardless of object key order', () => {
  assert.equal(stableStringify({b: 2, a: 1}), stableStringify({a: 1, b: 2}));
  assert.equal(sha256({b: 2, a: 1}), sha256({a: 1, b: 2}));
});

test('healthy observation compiles to a valid contract with hashed evidence', () => {
  const contract = compileDealContract(healthyObservation());
  const integrity = evaluateIntegrity(contract);
  assert.equal(integrity.status, 'valid');
  assert.equal(integrity.passed, integrity.total);
  assert.match(contract.contractHash, /^[a-f0-9]{64}$/);
  assert.ok(contract.evidence.every((e) => /^[a-f0-9]{64}$/.test(e.hash)));
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

test('promise diff captures price, fee, cancellation and inclusion changes', () => {
  const before = compileDealContract(healthyObservation());
  const after = compileDealContract(changedPromiseObservation());
  const paths = diffContracts(before, after).map((x) => x.path);
  for (const expected of ['offer.advertisedPrice','checkout.mandatoryFees','checkout.finalTotal','terms.cancellation','terms.inclusions']) assert.ok(paths.includes(expected), expected);
});

test('public-target policy rejects credential/private-like URLs', () => {
  assert.match(assertPublicTarget('https://example.com/hotels/room'), /^https:/);
  assert.throws(() => assertPublicTarget('ftp://example.com/file'));
  assert.throws(() => assertPublicTarget('https://user:pass@example.com/room'));
  assert.throws(() => assertPublicTarget('https://example.com/account/bookings'));
  assert.throws(() => assertPublicTarget('http://127.0.0.1:3000/fixture/hotel'), /publicly reachable/);
  assert.match(assertPublicTarget('http://127.0.0.1:3000/fixture/hotel', {allowLocal:true}), /^http:/);
});
