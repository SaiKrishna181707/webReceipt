import { sha256 } from './hash.js';

export const CONTRACT_SCHEMA_VERSION = '1.1.0';

const nonEmpty = (value, label) => {
  const out = String(value ?? '').trim();
  if (!out) throw new Error(`Missing required ${label}.`);
  return out;
};

function currencyCode(value = 'INR') {
  const code = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new Error(`Invalid currency code: ${value}`);
  return code;
}

function money(value, currency = 'INR') {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid monetary amount: ${value}`);
  return { amount: Math.round((amount + Number.EPSILON) * 100) / 100, currency };
}

function safeId(value, fallback) {
  const cleaned = String(value ?? '').trim().replace(/[^A-Za-z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 96);
  return cleaned || fallback;
}

function assertObservationShape(observation) {
  if (!observation || typeof observation !== 'object') throw new Error('Collector output must be an object.');
  nonEmpty(observation.subject, 'subject');
  nonEmpty(observation.targetUrl, 'targetUrl');
  if (!observation.offer || typeof observation.offer !== 'object') throw new Error('Missing required offer object.');
  if (!observation.checkout || typeof observation.checkout !== 'object') throw new Error('Missing required checkout object.');
  if (!observation.terms || typeof observation.terms !== 'object') throw new Error('Missing required terms object.');
  if (observation.journey != null && !Array.isArray(observation.journey)) throw new Error('journey must be an array.');
  if (observation.evidence != null && !Array.isArray(observation.evidence)) throw new Error('evidence must be an array.');
}

export function compileDealContract(observation) {
  assertObservationShape(observation);
  const observedAt = observation.observedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(observedAt))) throw new Error(`Invalid observedAt timestamp: ${observedAt}`);
  const currency = currencyCode(observation.currency ?? 'INR');
  const subject = nonEmpty(observation.subject, 'subject');
  const targetUrl = nonEmpty(observation.targetUrl, 'targetUrl');

  const evidence = (observation.evidence ?? []).map((item, index) => {
    const fallbackId = `ev_${index + 1}`;
    const canonical = {
      id: safeId(item.id, fallbackId),
      field: nonEmpty(item.field, `evidence[${index}].field`),
      sourceUrl: nonEmpty(item.sourceUrl, `evidence[${index}].sourceUrl`),
      capturedText: nonEmpty(item.capturedText, `evidence[${index}].capturedText`),
      screenshotRef: item.screenshotRef ? String(item.screenshotRef) : null,
      domPath: item.domPath ? String(item.domPath) : null,
      journeyStep: item.journeyStep == null ? null : Number(item.journeyStep),
      collectorVersion: String(item.collectorVersion ?? observation.collectorVersion ?? 'unknown'),
      observedAt: item.observedAt ?? observedAt
    };
    return { ...canonical, hash: sha256(canonical) };
  });

  const feeItems = (observation.checkout.feeItems ?? []).map((item, index) => ({
    label: nonEmpty(item.label, `checkout.feeItems[${index}].label`),
    ...money(item.amount, currency),
    required: item.required !== false
  }));

  const dealFallback = `deal_${sha256(`${subject}|${observedAt}`).slice(0, 10)}`;
  const contract = {
    schemaVersion: CONTRACT_SCHEMA_VERSION,
    dealId: safeId(observation.dealId, dealFallback),
    subject,
    targetUrl,
    observedAt,
    locale: String(observation.locale ?? 'en-IN'),
    collector: {
      id: safeId(observation.collectorId, 'unknown_collector'),
      version: String(observation.collectorVersion ?? 'unknown'),
      worker: String(observation.worker ?? 'browser')
    },
    offer: {
      advertisedPrice: money(observation.offer.advertisedPrice, currency),
      claims: Array.isArray(observation.offer.claims) ? observation.offer.claims.map(String) : []
    },
    checkout: {
      basePrice: money(observation.checkout.basePrice, currency),
      feeItems,
      mandatoryFees: money(observation.checkout.mandatoryFees, currency),
      taxes: money(observation.checkout.taxes, currency),
      optionalAddons: money(observation.checkout.optionalAddons ?? 0, currency),
      discounts: money(observation.checkout.discounts ?? 0, currency),
      finalTotal: money(observation.checkout.finalTotal, currency)
    },
    terms: {
      cancellation: nonEmpty(observation.terms.cancellation, 'terms.cancellation'),
      refundability: nonEmpty(observation.terms.refundability, 'terms.refundability'),
      paymentTiming: nonEmpty(observation.terms.paymentTiming, 'terms.paymentTiming'),
      inclusions: Array.isArray(observation.terms.inclusions) ? observation.terms.inclusions.map(String) : []
    },
    journey: (observation.journey ?? []).map((step, index) => ({
      index: index + 1,
      label: nonEmpty(step.label, `journey[${index}].label`),
      url: nonEmpty(step.url, `journey[${index}].url`),
      displayedPrice: money(step.displayedPrice, currency),
      evidenceId: step.evidenceId ? safeId(step.evidenceId, null) : null
    })),
    evidence
  };

  return { ...contract, contractHash: sha256(contract) };
}
