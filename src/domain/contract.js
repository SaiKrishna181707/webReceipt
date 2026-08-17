import { sha256 } from './hash.js';

export const CONTRACT_SCHEMA_VERSION = '1.0.0';

function money(value, currency = 'INR') {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid monetary amount: ${value}`);
  return { amount: Math.round(amount * 100) / 100, currency };
}

export function compileDealContract(observation) {
  const observedAt = observation.observedAt ?? new Date().toISOString();
  const currency = observation.currency ?? 'INR';
  const evidence = (observation.evidence ?? []).map((item, index) => {
    const canonical = {
      id: item.id ?? `ev_${index + 1}`,
      field: item.field,
      sourceUrl: item.sourceUrl,
      capturedText: item.capturedText,
      screenshotRef: item.screenshotRef ?? null,
      domPath: item.domPath ?? null,
      journeyStep: item.journeyStep ?? null,
      collectorVersion: item.collectorVersion ?? observation.collectorVersion ?? 'unknown',
      observedAt: item.observedAt ?? observedAt
    };
    return { ...canonical, hash: sha256(canonical) };
  });

  const feeItems = (observation.checkout.feeItems ?? []).map((item) => ({
    label: item.label,
    ...money(item.amount, currency),
    required: item.required !== false
  }));

  const contract = {
    schemaVersion: CONTRACT_SCHEMA_VERSION,
    dealId: observation.dealId ?? `deal_${sha256(`${observation.subject}|${observedAt}`).slice(0, 10)}`,
    subject: observation.subject,
    targetUrl: observation.targetUrl,
    observedAt,
    locale: observation.locale ?? 'en-IN',
    collector: {
      id: observation.collectorId ?? 'sim_webreceipt',
      version: observation.collectorVersion ?? 'sim-v1',
      worker: observation.worker ?? 'browser'
    },
    offer: {
      advertisedPrice: money(observation.offer.advertisedPrice, currency),
      claims: observation.offer.claims ?? []
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
      cancellation: observation.terms.cancellation,
      refundability: observation.terms.refundability,
      paymentTiming: observation.terms.paymentTiming,
      inclusions: observation.terms.inclusions ?? []
    },
    journey: (observation.journey ?? []).map((step, index) => ({
      index: index + 1,
      label: step.label,
      url: step.url,
      displayedPrice: money(step.displayedPrice, currency),
      evidenceId: step.evidenceId ?? null
    })),
    evidence
  };

  return { ...contract, contractHash: sha256(contract) };
}
