import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { JsonStore } from '../src/services/store.js';
import { WebReceiptService } from '../src/services/orchestrator.js';
import { SimulatorCollector } from '../src/integrations/simulator.js';

async function setup(name) {
  const store = new JsonStore(path.join(os.tmpdir(), `webreceipt-${name}-${crypto.randomUUID()}.json`));
  await store.reset();
  const collector = new SimulatorCollector();
  return { store, collector, service: new WebReceiptService({ collector, store }) };
}

test('observe returns a valid receipt in healthy mode', async () => {
  const { service } = await setup('healthy');
  const result = await service.observe();
  assert.equal(result.integrity.status, 'valid');
  assert.equal(result.healed, false);
  assert.ok(result.anomalies.some((a) => a.id === 'observed_price_increase'));
});

test('semantic drift triggers heal, retest, and valid recovery', async () => {
  const { service, store } = await setup('heal');
  const result = await service.observe({ mutation: 'wrong-valid-total' });
  assert.equal(result.healed, true);
  assert.equal(result.integrity.status, 'valid');
  assert.ok(store.state.events.some((e) => e.type === 'integrity'));
  assert.ok(store.state.events.some((e) => e.type === 'heal'));
  assert.ok(store.state.events.some((e) => e.type === 'success'));
});


test('the same semantic break can be deterministically replayed after a prior heal', async () => {
  const { service } = await setup('repeat-heal');
  const first = await service.observe({ mutation: 'wrong-valid-total' });
  const second = await service.observe({ mutation: 'wrong-valid-total' });
  assert.equal(first.healed, true);
  assert.equal(second.healed, true);
  assert.equal(second.integrity.status, 'valid');
});

test('chaos suite recovers every deterministic mutation', async () => {
  const { service } = await setup('stress');
  const run = await service.stress();
  assert.equal(run.recovered, run.total);
  assert.equal(run.total, 7);
  assert.ok(run.detected >= 3);
  assert.equal(run.results.find((r) => r.mutation === 'wrong-valid-total').healed, true);
  assert.equal(run.results.find((r) => r.mutation === 'new-mandatory-fee').healed, true);
  assert.equal(run.results.find((r) => r.mutation === 'missing-evidence').healed, true);
});

test('promise diff produces a valid later contract and material changes', async () => {
  const { service } = await setup('diff');
  await service.observe();
  const diff = await service.promiseDiff();
  assert.equal(diff.integrity.status, 'valid');
  assert.ok(diff.changes.length >= 5);
});
