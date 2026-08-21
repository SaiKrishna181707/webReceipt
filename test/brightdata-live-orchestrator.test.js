import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { JsonStore } from '../src/services/store.js';
import { WebReceiptService } from '../src/services/orchestrator.js';

const TARGET = 'https://web-receipt-tawny.vercel.app/fixture/hotel';

function flatHealthy() {
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

function parseError() {
  return {
    input: { url: TARGET },
    error: 'Parse error: value must be finite number',
    error_code: 'parse_error',
  };
}

async function makeService(collector) {
  const file = path.join(os.tmpdir(), `webreceipt-live-${randomUUID()}.json`);
  const store = new JsonStore(file);
  await store.reset();
  return {
    service: new WebReceiptService({ collector, store }),
    store,
    cleanup: () => fs.unlink(file).catch(() => {}),
  };
}

class GeneratedBrightDataCollector {
  constructor({ failFirst = false } = {}) {
    this.kind = 'brightdata';
    this.collectorId = 'c_mt3ha1iv1jgm8eg813';
    this.failFirst = failFirst;
    this.collectCalls = 0;
    this.approved = false;
    this.rejected = false;
    this.healPrompt = null;
  }

  async collect() {
    this.collectCalls++;
    if (this.failFirst && !this.approved) return parseError();
    return flatHealthy();
  }

  async heal({ prompt }) {
    this.healPrompt = prompt;
    return {
      status: 'awaiting_approval',
      approval: 'required',
      previewResult: flatHealthy(),
      diff: { template_b: { steps: [{}] } },
    };
  }

  async approveHeal({ autoSave }) {
    assert.equal(autoSave, true);
    this.approved = true;
    return { status: 'done', approval: 'approved', autoSaved: true };
  }

  async rejectHeal() {
    this.rejected = true;
    return { status: 'done', approval: 'rejected' };
  }
}

test('live service accepts the exact flat schema produced by the verified collector', async (t) => {
  const collector = new GeneratedBrightDataCollector();
  const { service, cleanup } = await makeService(collector);
  t.after(cleanup);
  const result = await service.observe({ targetUrl: TARGET, autoHeal: false });
  assert.equal(result.integrity.status, 'valid');
  assert.equal(result.contract.collector.id, collector.collectorId);
  assert.equal(result.contract.checkout.finalTotal.amount, 10147);
  assert.equal(result.contract.checkout.mandatoryFees.amount, 848);
  assert.equal(result.contract.evidence.length, 4);
  assert.equal(result.healed, false);
});

test('live parse_error triggers preview verification, approval, and same-collector rerun', async (t) => {
  const collector = new GeneratedBrightDataCollector({ failFirst: true });
  const { service, store, cleanup } = await makeService(collector);
  t.after(cleanup);
  const result = await service.observe({
    targetUrl: TARGET,
    mutation: 'live-semantic-drift',
    autoHeal: true,
  });
  assert.equal(result.healed, true);
  assert.equal(result.integrity.status, 'valid');
  assert.equal(result.contract.collector.id, collector.collectorId);
  assert.equal(result.contract.checkout.finalTotal.amount, 10147);
  assert.equal(result.repair.trigger, 'collector_failure');
  assert.match(result.repair.initialError, /parse_error/i);
  assert.equal(result.repair.previewIntegrity.status, 'valid');
  assert.equal(result.repair.approved, true);
  assert.equal(result.repair.postApprovalVerified, true);
  assert.equal(collector.collectCalls, 2);
  assert.match(collector.healPrompt, /collector failure before Deal Contract compilation/i);
  assert.match(collector.healPrompt, /final amount/i);
  const eventTypes = new Set(store.state.events.map((event) => event.type));
  for (const type of ['integrity', 'heal', 'verify', 'approve', 'success']) assert.ok(eventTypes.has(type), type);
});

test('live parse_error fails clearly when auto-heal is disabled', async (t) => {
  const collector = new GeneratedBrightDataCollector({ failFirst: true });
  const { service, cleanup } = await makeService(collector);
  t.after(cleanup);
  await assert.rejects(
    () => service.observe({ targetUrl: TARGET, autoHeal: false }),
    /collector output error \(parse_error\).*finite number/i,
  );
  assert.equal(collector.collectCalls, 1);
  assert.equal(collector.healPrompt, null);
});
