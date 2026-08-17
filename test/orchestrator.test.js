import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { JsonStore } from '../src/services/store.js';
import { WebReceiptService } from '../src/services/orchestrator.js';
import { SimulatorCollector } from '../src/integrations/simulator.js';
import { mutationObservation } from '../src/fixtures/observations.js';

async function setup(name, collector = new SimulatorCollector()) {
  const store = new JsonStore(path.join(os.tmpdir(), `webreceipt-${name}-${randomUUID()}.json`));
  await store.reset();
  return { store, collector, service: new WebReceiptService({ collector, store }) };
}

test('simulator refuses to pretend it scraped an arbitrary third-party URL', async () => {
  const { service } = await setup('simulator-honesty');
  await assert.rejects(() => service.observe({targetUrl:'https://example.com/hotel'}), /Select Bright Data live/);
});

test('observe returns a valid receipt in healthy mode', async () => {
  const { service } = await setup('healthy');
  const result = await service.observe();
  assert.equal(result.integrity.status, 'valid');
  assert.equal(result.healed, false);
  assert.equal(result.repair, null);
  assert.ok(result.anomalies.some((a) => a.id === 'observed_price_increase'));
});

test('semantic drift verifies repair preview before approval, then reruns successfully', async () => {
  const { service, store } = await setup('heal');
  const result = await service.observe({ mutation: 'wrong-valid-total' });
  assert.equal(result.healed, true);
  assert.equal(result.integrity.status, 'valid');
  assert.equal(result.repair.previewIntegrity.status, 'valid');
  assert.equal(result.repair.approved, true);
  assert.equal(result.repair.postApprovalVerified, true);
  const types = new Set(store.state.events.map((e) => e.type));
  for (const type of ['integrity', 'heal', 'verify', 'approve', 'success']) assert.ok(types.has(type), type);
});

class BadPreviewCollector extends SimulatorCollector {
  async heal(options) {
    const proposal = await super.heal(options);
    proposal.previewResult = [mutationObservation('wrong-valid-total')];
    return proposal;
  }
}

test('invalid self-heal preview is rejected before deployment', async () => {
  const collector = new BadPreviewCollector();
  const { service, store } = await setup('reject-bad-preview', collector);
  const result = await service.observe({ mutation:'wrong-valid-total' });
  assert.equal(result.healed, false);
  assert.equal(result.integrity.status, 'invalid');
  assert.equal(result.repair.rejected, true);
  assert.equal(result.repair.approved, false);
  assert.equal(result.repair.previewIntegrity.status, 'invalid');
  assert.ok(store.state.events.some((e) => e.type === 'reject'));
  assert.equal(collector.healed.has('wrong-valid-total'), false);
});

test('malformed self-heal preview is rejected instead of being auto-approved', async () => {
  class MalformedPreviewCollector extends SimulatorCollector {
    async heal(options) {
      const proposal = await super.heal(options);
      proposal.previewResult = [{ nope:true }];
      return proposal;
    }
  }
  const { service } = await setup('reject-malformed-preview', new MalformedPreviewCollector());
  const result = await service.observe({ mutation:'wrong-valid-total' });
  assert.equal(result.healed, false);
  assert.equal(result.repair.rejected, true);
  assert.equal(result.repair.previewIntegrity.failures[0].id, 'preview_compile_error');
});

test('the same semantic break can be deterministically replayed after a prior heal', async () => {
  const { service } = await setup('repeat-heal');
  const first = await service.observe({ mutation: 'wrong-valid-total' });
  const second = await service.observe({ mutation: 'wrong-valid-total' });
  assert.equal(first.healed, true);
  assert.equal(second.healed, true);
  assert.equal(second.integrity.status, 'valid');
});

test('concurrent semantic repairs do not share or overwrite approval state', async () => {
  const { service } = await setup('concurrent-repair');
  const mutations = ['wrong-valid-total', 'new-mandatory-fee', 'missing-evidence'];
  const results = await Promise.all(mutations.map((mutation) => service.observe({ mutation })));
  assert.equal(results.length, mutations.length);
  for (const result of results) {
    assert.equal(result.healed, true);
    assert.equal(result.integrity.status, 'valid');
    assert.equal(result.repair.previewIntegrity.status, 'valid');
    assert.equal(result.repair.approved, true);
    assert.equal(result.repair.postApprovalVerified, true);
  }
});


test('simulator rejects unknown mutations and bounds custom chaos requests', async () => {
  const { service } = await setup('invalid-mutation');
  await assert.rejects(() => service.observe({ mutation:'not-real' }), /Unknown simulator mutation/);
  await assert.rejects(() => service.stress({mutations:'wrong-valid-total'}), /non-empty array/);
  await assert.rejects(() => service.stress({mutations:Array(21).fill('wrong-valid-total')}), /at most 20/);
  await assert.rejects(() => service.stress({mutations:['wrong-valid-total','not-real']}), /Unknown simulator mutation/);
});

test('chaos suite recovers every deterministic mutation through the same verification gate', async () => {
  const { service } = await setup('stress');
  const run = await service.stress();
  assert.equal(run.recovered, run.total);
  assert.equal(run.total, 7);
  assert.ok(run.detected >= 3);
  for (const name of ['wrong-valid-total', 'new-mandatory-fee', 'missing-evidence']) {
    const result = run.results.find((r) => r.mutation === name);
    assert.equal(result.previewVerified, true, `${name} preview`);
    assert.equal(result.healed, true, `${name} healed`);
  }
});

test('synthetic Promise Diff is explicitly simulator-only and material', async () => {
  const { service } = await setup('diff');
  await service.observe();
  const diff = await service.simulatePromiseDiff();
  assert.equal(diff.integrity.status, 'valid');
  assert.equal(diff.source, 'simulated-day-plus-3');
  assert.ok(diff.changes.length >= 5);
});

test('stored-history diff compares two actual stored observations', async () => {
  const { service } = await setup('history-diff');
  const first = await service.observe();
  const second = await service.observe();
  const diff = await service.historyDiff({targetUrl:first.contract.targetUrl});
  assert.equal(diff.source, 'stored-history');
  assert.equal(diff.before.contractHash, first.contract.contractHash);
  assert.equal(diff.after.contractHash, second.contract.contractHash);
  assert.deepEqual(diff.changes, []);
});

class MissingPreviewCollector extends SimulatorCollector {
  async heal(options) {
    const proposal = await super.heal(options);
    proposal.previewResult = [];
    return proposal;
  }
}

test('self-heal proposal with no preview is rejected before deployment', async () => {
  const collector = new MissingPreviewCollector();
  const { service } = await setup('reject-missing-preview', collector);
  const result = await service.observe({mutation:'wrong-valid-total'});
  assert.equal(result.healed, false);
  assert.equal(result.repair.rejected, true);
  assert.equal(result.repair.previewIntegrity.failures[0].id, 'missing_heal_preview');
  assert.equal(collector.healed.has('wrong-valid-total'), false);
});

test('collector approval gate fails closed when approveHeal is not implemented', async () => {
  const base = new SimulatorCollector();
  const collector = {
    kind: 'simulator',
    get collectorId() { return base.collectorId; },
    inject: (...args) => base.inject(...args),
    collect: (...args) => base.collect(...args),
    heal: (...args) => base.heal(...args),
    rejectHeal: (...args) => base.rejectHeal(...args),
  };
  const { service } = await setup('missing-approve', collector);
  await assert.rejects(() => service.observe({mutation:'wrong-valid-total'}), /does not implement approveHeal/);
});

test('terminal no-gate heal still requires a fresh valid collector run', async () => {
  class TerminalCollector extends SimulatorCollector {
    async heal({mutation, prompt}) {
      this.healed.add(mutation);
      return {status:'done', approval:'not_required', mutation, prompt};
    }
  }
  const { service, store } = await setup('terminal-heal', new TerminalCollector());
  const result = await service.observe({mutation:'wrong-valid-total'});
  assert.equal(result.healed, true);
  assert.equal(result.repair.previewIntegrity, null);
  assert.equal(result.repair.postApprovalVerified, true);
  assert.ok(store.state.events.some((event) => event.message.includes('without an approval gate')));
});

test('even an approved valid preview is not called healed when the fresh run remains invalid', async () => {
  class StaleAfterApprovalCollector extends SimulatorCollector {
    async approveHeal({mutation} = {}) {
      return {status:'done', approval:'approved', mutation};
    }
  }
  const { service } = await setup('stale-post-approval', new StaleAfterApprovalCollector());
  const result = await service.observe({mutation:'wrong-valid-total'});
  assert.equal(result.repair.previewIntegrity.status, 'valid');
  assert.equal(result.repair.approved, true);
  assert.equal(result.repair.postApprovalVerified, false);
  assert.equal(result.healed, false);
  assert.equal(result.integrity.status, 'invalid');
});
