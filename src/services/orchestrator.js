import { randomUUID } from 'node:crypto';
import { compileDealContract } from '../domain/contract.js';
import { evaluateIntegrity } from '../domain/integrity.js';
import { detectAnomalies } from '../domain/anomalies.js';
import { diffContracts } from '../domain/diff.js';
import { assertPublicTarget } from '../domain/target-policy.js';
import { firstPreviewRecord } from '../integrations/brightdata.js';
import { normalizeBrightDataRecord } from '../integrations/brightdata-normalize.js';
import { changedPromiseObservation, MUTATIONS } from '../fixtures/observations.js';

function compileFromRaw(raw, { targetUrl, collector } = {}) {
  if (!raw || typeof raw !== 'object') throw new Error('Collector returned no structured observation.');
  const normalized = collector?.kind === 'brightdata'
    ? normalizeBrightDataRecord(raw, { targetUrl, collectorId: collector?.collectorId })
    : raw;
  return compileDealContract({
    ...normalized,
    ...(targetUrl ? { targetUrl } : {}),
    collectorId: normalized.collectorId ?? collector?.collectorId,
  });
}

function isHttpUrl(value) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
}

function normalizeProductObservation(raw, { targetUrl, collector } = {}) {
  if (!raw || raw.recordType !== 'product_observation') return null;
  if (raw.checkout != null) throw new Error('Product-page observation must not contain checkout fields unless checkout was actually observed.');
  const subject = String(raw.subject || raw.product?.name || '').trim();
  if (!subject) throw new Error('Product observation is missing product identity.');
  const productPrice = Number(raw.commercial?.productPrice);
  if (!Number.isFinite(productPrice) || productPrice < 0) throw new Error('Product observation is missing a valid semantic product price.');
  const currency = String(raw.commercial?.currency || raw.currency || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Product observation is missing a valid ISO currency.');
  const observedAt = raw.observedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(observedAt))) throw new Error('Product observation has an invalid timestamp.');
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];
  const priceEvidence = evidence.filter((item) => item?.field === 'commercial.productPrice');
  if (priceEvidence.length === 0) throw new Error('Product observation is missing product-price evidence.');
  const invalidEvidence = evidence.filter((item) => !item?.capturedText || !isHttpUrl(item?.sourceUrl));
  if (invalidEvidence.length) throw new Error('Product observation contains invalid evidence provenance.');

  const commercial = {
    ...raw.commercial,
    productPrice,
    currency,
  };
  for (const field of ['shippingFee', 'taxes', 'otherFees', 'discount', 'finalTotal']) {
    if (commercial[field] == null) continue;
    const amount = Number(commercial[field]);
    if (!Number.isFinite(amount) || amount < 0) throw new Error(`Product observation contains an invalid ${field}.`);
    commercial[field] = amount;
  }

  return {
    ...raw,
    recordType: 'product_observation',
    subject,
    targetUrl: targetUrl || raw.targetUrl,
    observedAt,
    currency,
    collectorId: raw.collectorId ?? collector?.collectorId ?? 'unknown_collector',
    commercial,
    product: {
      ...(raw.product || {}),
      name: String(raw.product?.name || subject),
    },
    evidence,
  };
}

function productObservationIntegrity(observation) {
  const evidencedFields = new Set(observation.evidence.map((item) => item.field));
  const checks = [
    {
      id: 'product_price_semantics',
      label: 'Product price has an explicit semantic role',
      pass: Number.isFinite(observation.commercial.productPrice),
      details: { productPrice: observation.commercial.productPrice, currency: observation.commercial.currency },
      severity: 'critical',
    },
    {
      id: 'product_price_evidence',
      label: 'Product price has provenance',
      pass: evidencedFields.has('commercial.productPrice'),
      details: { field: 'commercial.productPrice' },
      severity: 'critical',
    },
    {
      id: 'no_fabricated_checkout',
      label: 'Checkout totals are not invented from a product page',
      pass: observation.checkout == null,
      details: { checkoutObserved: false },
      severity: 'critical',
    },
    {
      id: 'source_provenance',
      label: 'Evidence sources use public HTTP(S) provenance',
      pass: observation.evidence.every((item) => isHttpUrl(item.sourceUrl)),
      details: { evidenceCount: observation.evidence.length },
      severity: 'high',
    },
  ];
  const failures = checks.filter((item) => !item.pass);
  return {
    status: failures.some((item) => item.severity === 'critical') ? 'invalid' : 'partial',
    stage: 'product_observation',
    sealable: false,
    reason: 'A product page proves the offer price, but a final Deal Contract requires an observed checkout/final payable total.',
    checks,
    failures,
    passed: checks.length - failures.length,
    total: checks.length,
  };
}

function assertSimulatorTarget(targetUrl) {
  const url = new URL(targetUrl);
  const controlledHost = url.hostname === 'demo.webreceipt.dev';
  const controlledFixture = url.pathname === '/fixture/hotel' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname.replace(/^\[|\]$/g, ''));
  if (!controlledHost && !controlledFixture) {
    throw new Error('Simulator mode only produces data for the controlled WebReceipt fixture. Select Bright Data live before observing a real third-party URL.');
  }
}

function assertSimulatorMutation(mutation) {
  if (mutation === 'healthy') return mutation;
  if (!MUTATIONS.includes(mutation)) throw new Error(`Unknown simulator mutation: ${mutation}`);
  return mutation;
}

function normalizeStressMutations(value) {
  const mutations = value ?? MUTATIONS;
  if (!Array.isArray(mutations) || mutations.length === 0 || mutations.length > 20) {
    throw new Error('Chaos Checkout mutations must be a non-empty array of at most 20 supported mutation names.');
  }
  for (const mutation of mutations) assertSimulatorMutation(mutation);
  return mutations;
}

async function safeReject(collector, mutation) {
  if (typeof collector.rejectHeal !== 'function') return null;
  try { return await collector.rejectHeal({ mutation }); }
  catch (error) { return { rejectionError: error.message }; }
}

export class WebReceiptService {
  constructor({ collector, store }) {
    this.collector = collector;
    this.store = store;
  }

  async repair({ contract = null, integrity = null, failure = null, mutation = 'healthy', targetUrl }) {
    const prompt = makeHealPrompt(contract, integrity, failure);
    if (integrity) {
      await this.store.event('integrity', 'Semantic contract failure detected', {
        mutation,
        failures: integrity.failures.map((item) => item.id),
      });
    } else {
      await this.store.event('integrity', 'Collector failed before Deal Contract compilation', {
        mutation,
        error: String(failure?.message || failure || 'unknown collector failure'),
      });
    }
    await this.store.event('heal', 'Requested a Scraper Studio self-heal proposal', { prompt });

    const proposal = await this.collector.heal({ mutation, prompt });

    const repair = {
      requested: true,
      trigger: integrity ? 'semantic_integrity' : 'collector_failure',
      initialError: failure ? String(failure?.message || failure) : null,
      proposalStatus: proposal?.status ?? 'unknown',
      approval: proposal?.approval ?? 'unknown',
      previewIntegrity: null,
      previewContractHash: null,
      approved: false,
      rejected: false,
      postApprovalVerified: false,
      proposal,
    };

    // The current Scraper Studio self-heal flow normally pauses at an approval
    // gate with preview_result. WebReceipt treats that preview as untrusted until
    // it compiles into the same canonical Deal Contract and passes every critical
    // semantic invariant.
    if (proposal?.approval === 'required' || proposal?.status === 'awaiting_approval') {
      const previewRaw = firstPreviewRecord(proposal.previewResult ?? proposal.preview_result);
      if (!previewRaw) {
        const rejection = await safeReject(this.collector, mutation);
        repair.rejected = true;
        repair.rejection = rejection;
        repair.previewIntegrity = { status: 'invalid', failures: [{ id: 'missing_heal_preview' }] };
        await this.store.event('error', 'Rejected self-heal: proposal had no structured preview result', { mutation });
        return repair;
      }

      let previewContract;
      try {
        previewContract = compileFromRaw(previewRaw, { targetUrl, collector: this.collector });
        repair.previewIntegrity = evaluateIntegrity(previewContract);
        repair.previewContractHash = previewContract.contractHash;
      } catch (error) {
        const rejection = await safeReject(this.collector, mutation);
        repair.rejected = true;
        repair.rejection = rejection;
        repair.previewIntegrity = {
          status: 'invalid',
          failures: [{ id: 'preview_compile_error', details: { message: error.message } }],
        };
        await this.store.event('error', 'Rejected self-heal: preview could not compile into the Deal Contract', {
          mutation,
          error: error.message,
        });
        return repair;
      }

      const previewValid = repair.previewIntegrity.status === 'valid';
      await this.store.event(previewValid ? 'verify' : 'error', previewValid
        ? `Repair preview passed ${repair.previewIntegrity.passed}/${repair.previewIntegrity.total} contract checks`
        : 'Repair preview failed semantic contract verification', {
        mutation,
        status: repair.previewIntegrity.status,
        failures: repair.previewIntegrity.failures.map((item) => item.id),
      });

      if (!previewValid) {
        const rejection = await safeReject(this.collector, mutation);
        repair.rejected = true;
        repair.rejection = rejection;
        await this.store.event('reject', 'Rejected self-heal before deployment', {
          mutation,
          failures: repair.previewIntegrity.failures.map((item) => item.id),
        });
        return repair;
      }

      if (typeof this.collector.approveHeal !== 'function') {
        throw new Error('Collector reached a repair approval gate but does not implement approveHeal().');
      }
      repair.completion = await this.collector.approveHeal({ autoSave: true, mutation });
      repair.approved = true;
      repair.approval = 'approved';
      await this.store.event('approve', 'Verified repair approved and saved', {
        mutation,
        previewContractHash: repair.previewContractHash,
      });
    } else {
      // Some Bright Data configurations may complete without a manual gate.
      // We cannot pre-approve what is already terminal, so we still require the
      // post-change rerun below before calling the repair successful.
      repair.approved = proposal?.approval === 'not_required';
      await this.store.event('verify', 'Self-heal returned without an approval gate; requiring post-heal verification', {
        mutation,
        proposalStatus: repair.proposalStatus,
      });
    }

    const retried = await this.collector.collect({ url: targetUrl, mutation });
    repair.postContract = compileFromRaw(retried, { targetUrl, collector: this.collector });
    repair.postIntegrity = evaluateIntegrity(repair.postContract);
    repair.postApprovalVerified = repair.postIntegrity.status === 'valid';
    await this.store.event(repair.postApprovalVerified ? 'success' : 'error', repair.postApprovalVerified
      ? 'Deployed repair passed a fresh collector run'
      : 'Deployed repair still violates the Deal Contract', {
      mutation,
      status: repair.postIntegrity.status,
      failures: repair.postIntegrity.failures.map((item) => item.id),
    });
    return repair;
  }

  async observe({ targetUrl = 'https://demo.webreceipt.dev/hotel/ocean-house', mutation = 'healthy', autoHeal = true } = {}) {
    const normalizedTarget = assertPublicTarget(targetUrl, { allowLocal: this.collector.kind === 'simulator' });
    if (this.collector.kind === 'simulator') {
      assertSimulatorTarget(normalizedTarget);
      assertSimulatorMutation(mutation);
    }
    await this.store.event('run', 'Observation started', { targetUrl: normalizedTarget, mutation, collector: this.collector.kind });
    if (mutation !== 'healthy' && typeof this.collector.inject === 'function') this.collector.inject(mutation);

    let raw;
    let contract;
    let integrity;
    let repair = null;
    try {
      raw = await this.collector.collect({ url: normalizedTarget, mutation });

      // Public product pages can provide a trustworthy offer price without a
      // trustworthy final checkout total. Return that structured observation as
      // partial rather than manufacturing zeros/totals or asking self-heal to
      // "repair" a checkout that was never observed.
      if (this.collector.kind === 'brightdata' && raw?.recordType === 'product_observation') {
        const observation = normalizeProductObservation(raw, { targetUrl: normalizedTarget, collector: this.collector });
        const productIntegrity = productObservationIntegrity(observation);
        if (productIntegrity.status === 'invalid') {
          throw new Error(`Product observation failed integrity: ${productIntegrity.failures.map((item) => item.id).join(', ')}`);
        }
        await this.store.event('observe', 'Product offer observed; receipt not sealed until checkout is evidenced', {
          targetUrl: normalizedTarget,
          productPrice: observation.commercial.productPrice,
          currency: observation.commercial.currency,
          collectorId: observation.collectorId,
        });
        return {
          recordType: 'product_observation',
          observation,
          product: observation.product,
          commercial: observation.commercial,
          contract: null,
          integrity: productIntegrity,
          anomalies: [],
          sealable: false,
          healed: false,
          repair: null,
          heal: null,
        };
      }

      contract = compileFromRaw(raw, { targetUrl: normalizedTarget, collector: this.collector });
      integrity = evaluateIntegrity(contract);
    } catch (error) {
      // Real collectors can fail before producing a compilable observation (for
      // example Bright Data parse_error after an interaction/layout change). In
      // heal mode, that failure is itself a repair trigger; without autoHeal we
      // fail clearly rather than manufacturing a fake contract.
      if (!(autoHeal && this.collector.kind === 'brightdata')) throw error;
      repair = await this.repair({
        failure: error,
        mutation,
        targetUrl: normalizedTarget,
      });
      if (!repair.postContract || !repair.postIntegrity) {
        throw new Error(`Bright Data collector failure was not repaired: ${error.message}`);
      }
      contract = repair.postContract;
      integrity = repair.postIntegrity;
    }

    if (integrity.status === 'invalid' && autoHeal && !repair) {
      repair = await this.repair({ contract, integrity, mutation, targetUrl: normalizedTarget });
      if (repair.postContract) {
        contract = repair.postContract;
        integrity = repair.postIntegrity;
      }
    }

    const healed = Boolean(repair?.postApprovalVerified);
    const anomalies = detectAnomalies(contract);
    await this.store.addContract(contract, integrity, anomalies);
    return {
      contract,
      integrity,
      anomalies,
      healed,
      repair,
      // Backward-compatible alias for the demo UI/tests created before the
      // verification gate was added.
      heal: repair?.proposal ?? null,
    };
  }

  async simulatePromiseDiff() {
    if (this.collector.kind !== 'simulator') throw new Error('Synthetic day +3 Promise Diff is available only in simulator mode. Use stored-history diff for live observations.');
    if (!this.store.state.contracts[0]?.contract) await this.observe();
    const before = this.store.state.contracts[0].contract;
    const after = compileDealContract(changedPromiseObservation());
    const integrity = evaluateIntegrity(after);
    const changes = diffContracts(before, after);
    await this.store.addContract(after, integrity, detectAnomalies(after));
    await this.store.event('diff', `${changes.length} simulated promise changes detected`, { changes, mode: 'simulator' });
    return { before, after, changes, integrity, source: 'simulated-day-plus-3' };
  }

  async historyDiff({ targetUrl } = {}) {
    const normalizedTarget = targetUrl ? assertPublicTarget(targetUrl, { allowLocal: this.collector.kind === 'simulator' }) : null;
    const contracts = this.store.state.contracts
      .map((entry) => entry.contract)
      .filter((item) => !normalizedTarget || item.targetUrl === normalizedTarget);
    if (contracts.length < 2) throw new Error('Need at least two stored observations for the same target before calculating a live Promise Diff.');
    const [after, before] = contracts;
    const changes = diffContracts(before, after);
    await this.store.event('diff', `${changes.length} stored promise changes detected`, {
      targetUrl: after.targetUrl,
      before: before.observedAt,
      after: after.observedAt,
    });
    return { before, after, changes, integrity: evaluateIntegrity(after), source: 'stored-history' };
  }

  async stress({ mutations } = {}) {
    if (this.collector.kind !== 'simulator') throw new Error('Chaos Checkout is intentionally simulator-only; live Bright Data runs use the controlled Break website flow.');
    mutations = normalizeStressMutations(mutations);
    const results = [];
    const started = Date.now();
    for (const mutation of mutations) {
      if (typeof this.collector.inject === 'function') this.collector.inject(mutation);
      const first = await this.collector.collect({ mutation });
      const initialContract = compileFromRaw(first, { collector: this.collector });
      const initialIntegrity = evaluateIntegrity(initialContract);
      let finalIntegrity = initialIntegrity;
      let healed = false;
      let previewVerified = false;
      let rejected = false;

      if (initialIntegrity.status === 'invalid') {
        const repair = await this.repair({
          contract: initialContract,
          integrity: initialIntegrity,
          mutation,
          targetUrl: initialContract.targetUrl,
        });
        finalIntegrity = repair.postIntegrity ?? initialIntegrity;
        healed = Boolean(repair.postApprovalVerified);
        previewVerified = repair.previewIntegrity?.status === 'valid';
        rejected = Boolean(repair.rejected);
      }

      results.push({
        mutation,
        initiallyValid: initialIntegrity.status === 'valid',
        detectedFailure: initialIntegrity.status === 'invalid',
        previewVerified,
        rejected,
        healed,
        finalStatus: finalIntegrity.status,
        failedChecks: initialIntegrity.failures.map((item) => item.id),
      });
    }

    const run = {
      id: randomUUID(),
      at: new Date().toISOString(),
      durationMs: Date.now() - started,
      total: results.length,
      initiallyHealthy: results.filter((result) => result.initiallyValid).length,
      detected: results.filter((result) => result.detectedFailure).length,
      previewVerified: results.filter((result) => result.previewVerified).length,
      recovered: results.filter((result) => result.initiallyValid || result.healed).length,
      results,
    };
    await this.store.addStressRun(run);
    await this.store.event('stress', `Chaos suite: ${run.recovered}/${run.total} resilient`, { run });
    return run;
  }
}

function makeHealPrompt(contract, integrity, failure) {
  if (failure) {
    return 'The scraper fails after the page interaction changed. Repair the interaction and parser while keeping the existing output schema and same collector. Ensure order_total is the final payable amount, not a subtotal, and preserve prices, required fees, tax, terms, offer_name, and journey_state.';
  }
  const failedChecks = integrity.failures.map((item) => item.id).slice(0, 4).join(', ');
  return `Checkout extraction is semantically invalid (${failedChecks}). Repair the scraper while keeping the existing output schema and same collector. Extract fields by meaning, not old selectors. order_total must be the final payable amount and must match base price plus required fees and tax.`;
}
