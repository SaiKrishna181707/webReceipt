const at = '2026-08-17T14:30:00.000Z';
const url = 'https://demo.webreceipt.dev/hotel/ocean-house';

const baseEvidence = [
  ['offer.advertisedPrice', 'Search result: Ocean House — ₹8,499', '/search', '.offer-price', 1],
  ['checkout.basePrice', 'Room price ₹8,499', '/checkout', '[data-testid="base-price"]', 3],
  ['checkout.mandatoryFees', 'Property fee ₹499 · Service fee ₹349', '/checkout', '[data-testid="fees"]', 3],
  ['checkout.finalTotal', 'Total due today ₹10,147', '/checkout', '[data-testid="order-total"]', 4],
  ['terms.cancellation', 'Free cancellation until 21 Aug', '/terms', '#cancellation', 4]
].map(([field, capturedText, path, domPath, journeyStep], i) => ({
  id: `ev_${i + 1}`, field, capturedText, sourceUrl: `${url}${path}`, domPath, screenshotRef: `screenshots/step-${journeyStep}.png`, journeyStep, observedAt: at, collectorVersion: 'v1'
}));

export function healthyObservation(overrides = {}) {
  return {
    dealId: 'deal_ocean_house', subject: 'Ocean House · 1 night · Deluxe Room', targetUrl: url,
    observedAt: at, locale: 'en-IN', currency: 'INR', collectorId: 'c_webreceipt_demo', collectorVersion: 'v1', worker: 'browser',
    offer: { advertisedPrice: 8499, claims: ['Free cancellation', 'Breakfast included'] },
    checkout: {
      basePrice: 8499,
      feeItems: [{ label: 'Property fee', amount: 499 }, { label: 'Service fee', amount: 349 }],
      mandatoryFees: 848, taxes: 800, optionalAddons: 0, finalTotal: 10147
    },
    terms: { cancellation: 'Free cancellation until 21 Aug', refundability: 'Refundable', paymentTiming: 'Pay now', inclusions: ['Breakfast'] },
    journey: [
      { label: 'Search', url: `${url}/search`, displayedPrice: 8499, evidenceId: 'ev_1' },
      { label: 'Property', url, displayedPrice: 8499, evidenceId: 'ev_1' },
      { label: 'Room', url: `${url}/room`, displayedPrice: 8499, evidenceId: 'ev_2' },
      { label: 'Checkout', url: `${url}/checkout`, displayedPrice: 10147, evidenceId: 'ev_4' }
    ],
    evidence: baseEvidence.map((x) => ({ ...x })),
    ...overrides
  };
}

export function mutationObservation(name) {
  const base = healthyObservation({ collectorVersion: `broken-${name}` });
  switch (name) {
    case 'css-rename':
      return base;
    case 'dom-relocation':
      return base;
    case 'split-price-nodes':
      return base;
    case 'currency-format':
      return base;
    case 'wrong-valid-total':
      return { ...base, checkout: { ...base.checkout, finalTotal: 8499 }, evidence: base.evidence.map((e) => e.field === 'checkout.finalTotal' ? { ...e, capturedText: 'Subtotal ₹8,499', domPath: '.legacy-total-price' } : e) };
    case 'new-mandatory-fee':
      return { ...base, checkout: { ...base.checkout, feeItems: [...base.checkout.feeItems, { label: 'Destination fee', amount: 300 }], mandatoryFees: 848, finalTotal: 10447 } };
    case 'missing-evidence':
      return { ...base, evidence: base.evidence.filter((e) => e.field !== 'terms.cancellation') };
    default:
      throw new Error(`Unknown mutation: ${name}`);
  }
}

export function changedPromiseObservation() {
  const base = healthyObservation({ observedAt: '2026-08-20T14:30:00.000Z', collectorVersion: 'v3' });
  return {
    ...base,
    offer: { ...base.offer, advertisedPrice: 8999 },
    checkout: {
      ...base.checkout,
      basePrice: 8999,
      feeItems: [{ label: 'Property fee', amount: 799 }, { label: 'Service fee', amount: 349 }],
      mandatoryFees: 1148,
      finalTotal: 10947
    },
    terms: { ...base.terms, cancellation: 'Non-refundable', inclusions: [] },
    journey: base.journey.map((s, i) => ({ ...s, displayedPrice: i === 3 ? 10947 : 8999 })),
    evidence: base.evidence.map((e) => {
      if (e.field === 'offer.advertisedPrice') return { ...e, capturedText: 'Search result: Ocean House — ₹8,999', observedAt: '2026-08-20T14:30:00.000Z', collectorVersion: 'v3' };
      if (e.field === 'checkout.basePrice') return { ...e, capturedText: 'Room price ₹8,999', observedAt: '2026-08-20T14:30:00.000Z', collectorVersion: 'v3' };
      if (e.field === 'checkout.mandatoryFees') return { ...e, capturedText: 'Property fee ₹799 · Service fee ₹349', observedAt: '2026-08-20T14:30:00.000Z', collectorVersion: 'v3' };
      if (e.field === 'checkout.finalTotal') return { ...e, capturedText: 'Total due today ₹10,947', observedAt: '2026-08-20T14:30:00.000Z', collectorVersion: 'v3' };
      if (e.field === 'terms.cancellation') return { ...e, capturedText: 'Non-refundable', observedAt: '2026-08-20T14:30:00.000Z', collectorVersion: 'v3' };
      return e;
    })
  };
}

export const MUTATIONS = ['css-rename', 'dom-relocation', 'split-price-nodes', 'currency-format', 'wrong-valid-total', 'new-mandatory-fee', 'missing-evidence'];
