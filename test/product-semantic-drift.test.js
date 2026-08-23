import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { scrapeProductControlledFixture } from '../src/integrations/product-controlled-fixture.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';
import { SimulatorCollector } from '../src/integrations/simulator.js';
import { JsonStore } from '../src/services/store.js';
import { WebReceiptService } from '../src/services/orchestrator.js';

const TARGET = 'https://demo.webreceipt.dev/fixture/product';
const files = [];

test.after(async () => {
  await Promise.all(files.map((file) => fs.unlink(file).catch(() => {})));
});

test('product fixture creates genuine wrong-role drift from a website redesign', () => {
  const v1 = scrapeProductControlledFixture({ websiteVersion: 'v1', scraperVersion: 'v1', targetUrl: TARGET });
  const redesigned = scrapeProductControlledFixture({ websiteVersion: 'v2', scraperVersion: 'v1', targetUrl: TARGET });
  const repaired = scrapeProductControlledFixture({ websiteVersion: 'v2', scraperVersion: 'v2', targetUrl: TARGET });

  // V1: the product price and final total have distinct, correct meanings.
  assert.equal(v1.commercial.productPrice, 12999);
  assert.equal(v1.commercial.shippingFee, 500);
  assert.equal(v1.commercial.taxes, 0);
  assert.equal(v1.commercial.otherFees, 0);
  assert.equal(v1.commercial.discount, 0);
  assert.equal(v1.commercial.finalTotal, 13499);
  assert.equal(evaluateIntegrity(compileDealContract(v1)).status, 'valid');

  // V2: the website changed, but the SAME V1 scraper still follows `.total-price`.
  // That selector now points at the legitimate product price, so extraction did
  // not crash and the value is not fabricated — only its semantic role is wrong.
  assert.equal(v1.collectorId, redesigned.collectorId);
  assert.equal(v1.commercial.productPrice, redesigned.commercial.productPrice);
  assert.equal(redesigned.commercial.productPrice, 12999);
  assert.equal(redesigned.commercial.finalTotal, 12999);
  const driftEvidence = redesigned.evidence.find((item) => item.field === 'checkout.finalTotal');
  assert.equal(driftEvidence.domPath, '.total-price');
  assert.match(driftEvidence.capturedText, /Product price.*12,999/);

  const driftIntegrity = evaluateIntegrity(compileDealContract(redesigned));
  assert.equal(driftIntegrity.status, 'invalid');
  const arithmetic = driftIntegrity.failures.find((item) => item.id === 'total_arithmetic');
  assert.ok(arithmetic);
  assert.equal(arithmetic.details.expected, 13499);
  assert.equal(arithmetic.details.extracted, 12999);

  // The repaired scraper follows semantic meaning at the redesigned location.
  assert.equal(repaired.commercial.productPrice, 12999);
  assert.equal(repaired.commercial.finalTotal, 13499);
  const repairedEvidence = repaired.evidence.find((item) => item.field === 'checkout.finalTotal');
  assert.equal(repairedEvidence.domPath, '[data-testid="order-total"]');
  assert.match(repairedEvidence.capturedText, /Final total.*13,499/);
  assert.equal(evaluateIntegrity(compileDealContract(repaired)).status, 'valid');
});

test('product drift repair is preview-verified, approved, rerun on the same collector, and version-diffed', async () => {
  const file = path.join(os.tmpdir(), `webreceipt-product-drift-${randomUUID()}.json`);
  files.push(file);
  const store = new JsonStore(file);
  await store.reset();
  const collector = new SimulatorCollector();
  const service = new WebReceiptService({ collector, store });

  const v1 = await service.observe({ targetUrl: TARGET, mutation: 'healthy', autoHeal: false });
  const v2 = await service.observe({ targetUrl: TARGET, mutation: 'wrong-valid-total', autoHeal: false });
  const v3 = await service.observe({ targetUrl: TARGET, mutation: 'wrong-valid-total', autoHeal: true });

  assert.equal(v1.contract.collector.id, v2.contract.collector.id);
  assert.equal(v2.contract.collector.id, v3.contract.collector.id);
  assert.equal(v1.contract.checkout.finalTotal.amount, 13499);
  assert.equal(v2.contract.checkout.finalTotal.amount, 12999);
  assert.equal(v2.integrity.status, 'invalid');
  assert.equal(v3.healed, true);
  assert.equal(v3.repair.previewIntegrity.status, 'valid');
  assert.equal(v3.repair.previewIntegrity.passed, 11);
  assert.equal(v3.repair.previewIntegrity.total, 11);
  assert.equal(v3.repair.approved, true);
  assert.equal(v3.repair.postApprovalVerified, true);
  assert.equal(v3.integrity.status, 'valid');
  assert.equal(v3.contract.checkout.finalTotal.amount, 13499);

  // Three immutable observations are retained; the stored-history diff is based
  // on actual adjacent contract versions, not a hardcoded synthetic change.
  const productHistory = store.state.contracts.filter((entry) => entry.contract.targetUrl === TARGET);
  assert.equal(productHistory.length, 3);
  const diff = await service.historyDiff({ targetUrl: TARGET });
  assert.equal(diff.source, 'stored-history');
  const totalChange = diff.changes.find((change) => change.path === 'checkout.finalTotal');
  assert.ok(totalChange);
  assert.equal(totalChange.before, 12999);
  assert.equal(totalChange.after, 13499);
});
