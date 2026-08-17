import { compileDealContract } from '../domain/contract.js';
import { evaluateIntegrity } from '../domain/integrity.js';
import { detectAnomalies } from '../domain/anomalies.js';
import { diffContracts } from '../domain/diff.js';
import { assertPublicTarget } from '../domain/target-policy.js';
import { changedPromiseObservation, MUTATIONS } from '../fixtures/observations.js';

export class WebReceiptService {
  constructor({ collector, store }) { this.collector = collector; this.store = store; }

  async observe({ targetUrl = 'https://demo.webreceipt.dev/hotel/ocean-house', mutation = 'healthy', autoHeal = true } = {}) {
    assertPublicTarget(targetUrl, { allowLocal: this.collector.kind === 'simulator' });
    await this.store.event('run', 'Observation started', { targetUrl, mutation });
    if (mutation !== 'healthy' && typeof this.collector.inject === 'function') this.collector.inject(mutation);
    const raw = await this.collector.collect({ url: targetUrl, mutation });
    let contract = compileDealContract({ ...raw, targetUrl, collectorId: raw.collectorId ?? this.collector.collectorId });
    let integrity = evaluateIntegrity(contract);
    let healed = false;
    let heal = null;

    if (integrity.status === 'invalid' && autoHeal) {
      const prompt = makeHealPrompt(contract, integrity);
      await this.store.event('integrity', 'Semantic contract failure detected', { mutation, failures: integrity.failures.map((f) => f.id) });
      await this.store.event('heal', 'Triggering scraper self-heal', { prompt });
      heal = await this.collector.heal({ mutation, prompt, customInput: [{ url: targetUrl }] });
      const retried = await this.collector.collect({ url: targetUrl, mutation });
      contract = compileDealContract({ ...retried, targetUrl, collectorId: retried.collectorId ?? this.collector.collectorId });
      integrity = evaluateIntegrity(contract);
      healed = integrity.status === 'valid';
      await this.store.event(healed ? 'success' : 'error', healed ? 'Healed collector passed all contract checks' : 'Healed collector still violates contract', { mutation, integrity: integrity.status });
    }

    const anomalies = detectAnomalies(contract);
    await this.store.addContract(contract, integrity, anomalies);
    return { contract, integrity, anomalies, healed, heal };
  }

  async promiseDiff() {
    const latest = this.store.state.contracts[0]?.contract;
    if (!latest) await this.observe();
    const before = this.store.state.contracts[0].contract;
    const after = compileDealContract(changedPromiseObservation());
    const integrity = evaluateIntegrity(after);
    const changes = diffContracts(before, after);
    await this.store.addContract(after, integrity, detectAnomalies(after));
    await this.store.event('diff', `${changes.length} promise changes detected`, { changes });
    return { before, after, changes, integrity };
  }

  async stress({ mutations = MUTATIONS } = {}) {
    const results = [];
    const started = Date.now();
    for (const mutation of mutations) {
      if (typeof this.collector.inject === 'function') this.collector.inject(mutation);
      const first = await this.collector.collect({ mutation });
      const initialContract = compileDealContract(first);
      const initialIntegrity = evaluateIntegrity(initialContract);
      let finalIntegrity = initialIntegrity;
      let healed = false;
      if (initialIntegrity.status === 'invalid') {
        const prompt = makeHealPrompt(initialContract, initialIntegrity);
        await this.collector.heal({ mutation, prompt, customInput: [{ url: initialContract.targetUrl }] });
        const retried = await this.collector.collect({ mutation });
        finalIntegrity = evaluateIntegrity(compileDealContract(retried));
        healed = finalIntegrity.status === 'valid';
      }
      results.push({ mutation, initiallyValid: initialIntegrity.status === 'valid', detectedFailure: initialIntegrity.status === 'invalid', healed, finalStatus: finalIntegrity.status, failedChecks: initialIntegrity.failures.map((f) => f.id) });
    }
    const run = {
      id: crypto.randomUUID(), at: new Date().toISOString(), durationMs: Date.now() - started,
      total: results.length,
      initiallyHealthy: results.filter((x) => x.initiallyValid).length,
      detected: results.filter((x) => x.detectedFailure).length,
      recovered: results.filter((x) => x.initiallyValid || x.healed).length,
      results
    };
    await this.store.addStressRun(run);
    await this.store.event('stress', `Chaos suite: ${run.recovered}/${run.total} resilient`, { run });
    return run;
  }
}

function makeHealPrompt(contract, integrity) {
  const failures = integrity.failures.map((f) => `${f.id}: ${JSON.stringify(f.details)}`).join('; ');
  return `WebReceipt semantic integrity failure. Preserve the output schema and collector identity. Re-extract values from the current public page based on field meaning, not legacy selectors. Failures: ${failures}. Critical rule: final_total must represent the amount due and equal base_price + mandatory_fees + taxes + selected_optional_addons - discounts. Attach source evidence for critical fields. Target: ${contract.targetUrl}`;
}
