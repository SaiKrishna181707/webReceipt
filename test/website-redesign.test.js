import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { scrapeControlledFixture } from '../src/integrations/controlled-fixture.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';
import { SimulatorCollector } from '../src/integrations/simulator.js';
import { JsonStore } from '../src/services/store.js';
import { WebReceiptService } from '../src/services/orchestrator.js';

const files = [];

test.after(async () => {
  await Promise.all(files.map((file) => fs.unlink(file).catch(() => {})));
});

test('website redesign causes wrong-but-valid extraction without mutating the observation', () => {
  const v1 = scrapeControlledFixture({ websiteVersion: 'v1', scraperVersion: 'v1' });
  const redesigned = scrapeControlledFixture({ websiteVersion: 'v2', scraperVersion: 'v1' });
  const repaired = scrapeControlledFixture({ websiteVersion: 'v2', scraperVersion: 'v2' });

  assert.equal(v1.collectorId, redesigned.collectorId);
  assert.equal(redesigned.collectorId, repaired.collectorId);
  assert.equal(v1.checkout.finalTotal, 10147);
  assert.equal(redesigned.checkout.finalTotal, 8499);
  assert.equal(repaired.checkout.finalTotal, 10147);

  const brokenEvidence = redesigned.evidence.find((item) => item.field === 'checkout.finalTotal');
  const repairedEvidence = repaired.evidence.find((item) => item.field === 'checkout.finalTotal');
  assert.equal(brokenEvidence.domPath, '.total-price');
  assert.match(brokenEvidence.capturedText, /Subtotal.*8,499/);
  assert.equal(repairedEvidence.domPath, '[data-testid="order-total"]');
  assert.match(repairedEvidence.capturedText, /Total due today.*10,147/);

  const brokenIntegrity = evaluateIntegrity(compileDealContract(redesigned));
  assert.equal(brokenIntegrity.status, 'invalid');
  const arithmetic = brokenIntegrity.failures.find((item) => item.id === 'total_arithmetic');
  assert.ok(arithmetic);
  assert.equal(arithmetic.details.expected, 10147);
  assert.equal(arithmetic.details.extracted, 8499);
});

test('same collector is repaired only after preview verification and a fresh rerun', async () => {
  const file = path.join(os.tmpdir(), `webreceipt-redesign-${randomUUID()}.json`);
  files.push(file);
  const store = new JsonStore(file);
  await store.reset();
  const collector = new SimulatorCollector();
  const service = new WebReceiptService({ collector, store });

  const healthy = await service.observe({ mutation: 'healthy', autoHeal: false });
  const broken = await service.observe({ mutation: 'wrong-valid-total', autoHeal: false });
  const healed = await service.observe({ mutation: 'wrong-valid-total', autoHeal: true });

  assert.equal(healthy.contract.collector.id, broken.contract.collector.id);
  assert.equal(broken.contract.collector.id, healed.contract.collector.id);
  assert.equal(broken.integrity.status, 'invalid');
  assert.equal(broken.contract.checkout.finalTotal.amount, 8499);
  assert.equal(healed.healed, true);
  assert.equal(healed.repair.previewIntegrity.status, 'valid');
  assert.equal(healed.repair.previewIntegrity.passed, 11);
  assert.equal(healed.repair.previewIntegrity.total, 11);
  assert.equal(healed.repair.approved, true);
  assert.equal(healed.repair.postApprovalVerified, true);
  assert.equal(healed.integrity.status, 'valid');
  assert.equal(healed.integrity.passed, 11);
  assert.equal(healed.contract.checkout.finalTotal.amount, 10147);

  const healedEvidence = healed.contract.evidence.find((item) => item.field === 'checkout.finalTotal');
  assert.equal(healedEvidence.domPath, '[data-testid="order-total"]');
});
