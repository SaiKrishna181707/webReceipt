import { sha256 } from './hash.js';

const EPSILON = 0.01;
const close = (a, b) => Math.abs(a - b) <= EPSILON;
const isHttpUrl = (value) => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
};

function evidenceCanonical(evidence) {
  const { hash, ...canonical } = evidence;
  return canonical;
}

function contractCanonical(contract) {
  const { contractHash, ...canonical } = contract;
  return canonical;
}

export function evaluateIntegrity(contract) {
  const checks = [];
  const add = (id, label, pass, details, severity = 'critical') => checks.push({ id, label, pass, details, severity });
  const { checkout } = contract;
  const currency = checkout.basePrice.currency;
  const mandatoryFeeItems = checkout.feeItems.filter((x) => x.required).reduce((sum, x) => sum + x.amount, 0);
  const gross = checkout.basePrice.amount + checkout.mandatoryFees.amount + checkout.taxes.amount + checkout.optionalAddons.amount;
  const expectedTotal = Math.max(0, gross - checkout.discounts.amount);

  add('total_arithmetic', 'Checkout arithmetic', close(expectedTotal, checkout.finalTotal.amount), {
    expected: expectedTotal,
    extracted: checkout.finalTotal.amount,
    formula: 'max(0, base + mandatoryFees + taxes + optionalAddons - discounts) = finalTotal'
  });

  add('fee_breakdown', 'Mandatory fee breakdown', close(mandatoryFeeItems, checkout.mandatoryFees.amount), {
    expected: mandatoryFeeItems,
    extracted: checkout.mandatoryFees.amount
  });

  add('discount_bounds', 'Discount does not exceed gross charges', checkout.discounts.amount <= gross + EPSILON, {
    gross,
    discounts: checkout.discounts.amount
  }, 'high');

  const moneyFields = [checkout.basePrice, checkout.mandatoryFees, checkout.taxes, checkout.optionalAddons, checkout.discounts, checkout.finalTotal, contract.offer.advertisedPrice, ...checkout.feeItems];
  add('currency_consistency', 'Currency consistency', moneyFields.every((x) => x.currency === currency), { currency });

  const minimumExpected = Math.max(0, checkout.basePrice.amount - checkout.discounts.amount);
  add('journey_monotonicity', 'Final price is plausible after discounts', checkout.finalTotal.amount + EPSILON >= minimumExpected, {
    base: checkout.basePrice.amount, discounts: checkout.discounts.amount, minimumExpected, final: checkout.finalTotal.amount
  });

  const criticalFields = ['offer.advertisedPrice', 'checkout.basePrice', 'checkout.finalTotal', 'terms.cancellation'];
  const evidenced = new Set(contract.evidence.map((x) => x.field));
  const missingEvidence = criticalFields.filter((field) => !evidenced.has(field));
  add('critical_evidence', 'Critical fields have provenance', missingEvidence.length === 0, { missingEvidence });

  const badEvidenceHashes = contract.evidence.filter((e) => e.hash !== sha256(evidenceCanonical(e))).map((e) => e.id);
  add('evidence_hashes', 'Evidence hashes are intact', badEvidenceHashes.length === 0, { badEvidenceHashes });

  const contractHashValid = contract.contractHash === sha256(contractCanonical(contract));
  add('contract_hash', 'Deal Contract hash is intact', contractHashValid, { expected: sha256(contractCanonical(contract)), extracted: contract.contractHash });

  const evidenceIds = new Set(contract.evidence.map((e) => e.id));
  const missingJourneyEvidence = contract.journey.filter((step) => step.evidenceId && !evidenceIds.has(step.evidenceId)).map((step) => step.index);
  add('evidence_links', 'Journey evidence references resolve', missingJourneyEvidence.length === 0, { missingJourneyEvidence }, 'high');

  const invalidSourceIds = contract.evidence.filter((e) => !isHttpUrl(e.sourceUrl)).map((e) => e.id);
  add('source_urls', 'Evidence sources use HTTP(S) URLs', invalidSourceIds.length === 0, { invalidSourceIds }, 'high');

  const journeyHasEndpoints = contract.journey.length >= 2 && contract.journey[0]?.displayedPrice && contract.journey.at(-1)?.displayedPrice;
  add('journey_complete', 'Journey has comparable start and end observations', Boolean(journeyHasEndpoints), { steps: contract.journey.length }, 'high');

  const failures = checks.filter((x) => !x.pass);
  return {
    status: failures.some((x) => x.severity === 'critical') ? 'invalid' : failures.length ? 'warning' : 'valid',
    checks,
    failures,
    passed: checks.length - failures.length,
    total: checks.length
  };
}
