import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { JsonStore } from '../src/services/store.js';
import { WebReceiptService } from '../src/services/orchestrator.js';
import { SimulatorCollector } from '../src/integrations/simulator.js';

test('concurrent observations preserve valid atomic JSON state', async () => {
  const file = path.join(os.tmpdir(), `webreceipt-concurrency-${crypto.randomUUID()}.json`);
  const store = new JsonStore(file);
  await store.reset();
  const service = new WebReceiptService({ collector: new SimulatorCollector(), store });
  const results = await Promise.all(Array.from({length: 24}, () => service.observe()));
  assert.ok(results.every((x) => x.integrity.status === 'valid'));
  await store.writeQueue;
  const persisted = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(persisted.contracts.length, 20); // retention cap
  assert.ok(persisted.events.length >= 24);
  assert.ok(persisted.contracts.every((x) => x.integrity.status === 'valid'));
});
