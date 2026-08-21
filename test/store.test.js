import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { JsonStore, resolveStateFile } from '../src/services/store.js';
import { WebReceiptService } from '../src/services/orchestrator.js';
import { SimulatorCollector } from '../src/integrations/simulator.js';
import { compileDealContract } from '../src/domain/contract.js';
import { healthyObservation } from '../src/fixtures/observations.js';

test('Vercel state defaults to writable temp storage instead of the read-only project tree', () => {
  const resolved = resolveStateFile({ VERCEL:'1', WEBRECEIPT_STATE_FILE:'data/state.json' });
  assert.equal(resolved, path.join(os.tmpdir(), 'webreceipt-state.json'));
  assert.equal(resolveStateFile({ VERCEL_ENV:'production' }), path.join(os.tmpdir(), 'webreceipt-state.json'));
  const explicitTmp = path.join(os.tmpdir(), 'custom-webreceipt-state.json');
  assert.equal(resolveStateFile({ VERCEL:'1', WEBRECEIPT_STATE_FILE:explicitTmp }), explicitTmp);
});

test('concurrent observations preserve valid atomic JSON state', async (t) => {
  const file = path.join(os.tmpdir(), `webreceipt-concurrency-${randomUUID()}.json`);
  t.after(async () => { await fs.unlink(file).catch(() => {}); });
  const store = new JsonStore(file);
  await store.reset();
  const service = new WebReceiptService({ collector: new SimulatorCollector(), store });
  const results = await Promise.all(Array.from({length: 48}, () => service.observe()));
  assert.ok(results.every((x) => x.integrity.status === 'valid'));
  await store.writeQueue;
  const persisted = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(persisted.contracts.length, 40); // retention cap
  assert.ok(persisted.events.length >= 48);
  assert.ok(persisted.contracts.every((x) => x.integrity.status === 'valid'));
});

test('corrupted state file is backed up and recovered instead of crashing startup', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'webreceipt-corrupt-'));
  t.after(async () => { await fs.rm(dir, { recursive: true, force: true }).catch(() => {}); });
  const file = path.join(dir, 'state.json');
  await fs.writeFile(file, '{definitely broken json');
  const store = new JsonStore(file);
  const state = await store.load();
  assert.deepEqual(state, {contracts:[], events:[], stressRuns:[]});
  const names = await fs.readdir(dir);
  assert.ok(names.some((name) => name.startsWith('state.json.corrupt-')));
  const recovered = await fs.readFile(file, 'utf8');
  assert.doesNotThrow(() => JSON.parse(recovered));
});

test('valid JSON with malformed state fields is normalized instead of trusted', async (t) => {
  const file = path.join(os.tmpdir(), `webreceipt-shape-${randomUUID()}.json`);
  t.after(async () => { await fs.unlink(file).catch(() => {}); });
  await fs.writeFile(file, JSON.stringify({contracts:'not-an-array', events:null, stressRuns:{}}));
  const store = new JsonStore(file);
  const state = await store.load();
  assert.deepEqual(state, {contracts:[], events:[], stressRuns:[]});
});

test('persisted receipts are revalidated on restart instead of trusting stale verdicts', async (t) => {
  const file = path.join(os.tmpdir(), `webreceipt-revalidate-${randomUUID()}.json`);
  t.after(async () => { await fs.unlink(file).catch(() => {}); });
  const contract = compileDealContract(healthyObservation());
  const stored = {
    contracts: [{contract, integrity:{status:'valid', passed:999, total:999}, anomalies:[]}],
    events: [],
    stressRuns: [],
  };
  stored.contracts[0].contract.evidence[0].capturedText = 'tampered after capture';
  await fs.writeFile(file, JSON.stringify(stored));

  const store = new JsonStore(file);
  const state = await store.load();
  assert.equal(state.contracts.length, 1);
  assert.equal(state.contracts[0].integrity.status, 'invalid');
  assert.ok(state.contracts[0].integrity.failures.some((failure) => failure.id === 'evidence_hashes'));
  assert.notEqual(state.contracts[0].integrity.passed, 999);
});

test('structurally unusable persisted contract records are dropped on restart', async (t) => {
  const file = path.join(os.tmpdir(), `webreceipt-drop-bad-${randomUUID()}.json`);
  t.after(async () => { await fs.unlink(file).catch(() => {}); });
  await fs.writeFile(file, JSON.stringify({contracts:[{contract:{nope:true}}], events:[], stressRuns:[]}));
  const store = new JsonStore(file);
  const state = await store.load();
  assert.deepEqual(state.contracts, []);
});
