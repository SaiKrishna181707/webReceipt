// WebReceipt custom Scraper Studio Browser Worker parser.
// IMPORTANT DEMO PROPERTY:
// The initial production parser intentionally uses `.total-price` as finalTotal.
// Fixture V1: this means total due (correct).
// Fixture V2: the selector still exists but now means SUBTOTAL (silently wrong).
// WebReceipt's semantic integrity engine detects the contradiction and asks
// Scraper Studio Self-Healing to repair by field meaning, not selector name.

const firstText = (selector) => $(selector).first().text_sane();
const parseMoney = (value) => {
  const normalized = String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[^0-9.,-]/g, '')
    .replace(/,/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
};
const money = (selector) => parseMoney(firstText(selector));
const screenshotRef = (field, fallback) => {
  const value = parser[field];
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object')
    return value.file_path || value.url || value.remote_url || fallback;
  return fallback;
};

const now = new Date().toISOString();
const source = location.href;
const advertised = money('[data-testid="advertised-price"]');
const base = money('[data-testid="base-price"]');
const propertyFee = money('.fee-property');
const serviceFee = money('.fee-service');
const tax = money('[data-testid="tax"]');
const finalTotal = money('.total-price'); // deliberate wrong-but-valid failure after V2 redesign
const offerScreenshot = screenshotRef('offer_screenshot', 'offer_screenshot');
const checkoutScreenshot = screenshotRef('checkout_screenshot', 'checkout_screenshot');
const claims = $('.claim').toArray().map((el) => $(el).text_sane()).filter(Boolean);

return {
  subject: 'Ocean House · 1 night · Deluxe Room',
  targetUrl: source,
  observedAt: now,
  locale: 'en-IN',
  currency: 'INR',
  collectorVersion: 'webreceipt-custom-v1',
  worker: 'browser',
  offer: {
    advertisedPrice: advertised,
    claims,
  },
  checkout: {
    basePrice: base,
    feeItems: [
      {label: 'Property fee', amount: propertyFee, required: true},
      {label: 'Service fee', amount: serviceFee, required: true},
    ],
    mandatoryFees: Number(propertyFee || 0) + Number(serviceFee || 0),
    taxes: tax,
    optionalAddons: 0,
    discounts: 0,
    finalTotal,
  },
  terms: {
    cancellation: firstText('#cancellation').replace(/^Cancellation:\s*/i, ''),
    refundability: firstText('#refundability').replace(/^Refundability:\s*/i, ''),
    paymentTiming: firstText('#payment-timing').replace(/^Payment:\s*/i, ''),
    inclusions: [firstText('#inclusions').replace(/^Includes:\s*/i, '')].filter(Boolean),
  },
  journey: [
    {label: 'Offer', url: source, displayedPrice: advertised, evidenceId: 'ev_offer'},
    {label: 'Checkout', url: source, displayedPrice: finalTotal, evidenceId: 'ev_total'},
  ],
  evidence: [
    {
      id: 'ev_offer', field: 'offer.advertisedPrice', sourceUrl: source,
      capturedText: firstText('[data-testid="advertised-price"]'),
      domPath: '[data-testid="advertised-price"]', screenshotRef: offerScreenshot,
      journeyStep: 1, observedAt: now, collectorVersion: 'webreceipt-custom-v1',
    },
    {
      id: 'ev_base', field: 'checkout.basePrice', sourceUrl: source,
      capturedText: firstText('[data-testid="base-price"]'),
      domPath: '[data-testid="base-price"]', screenshotRef: checkoutScreenshot,
      journeyStep: 2, observedAt: now, collectorVersion: 'webreceipt-custom-v1',
    },
    {
      id: 'ev_fees', field: 'checkout.mandatoryFees', sourceUrl: source,
      capturedText: `${firstText('.fee-property')} + ${firstText('.fee-service')}`,
      domPath: '.fee-property,.fee-service', screenshotRef: checkoutScreenshot,
      journeyStep: 2, observedAt: now, collectorVersion: 'webreceipt-custom-v1',
    },
    {
      id: 'ev_total', field: 'checkout.finalTotal', sourceUrl: source,
      capturedText: firstText('.total-price'), domPath: '.total-price',
      screenshotRef: checkoutScreenshot, journeyStep: 2, observedAt: now,
      collectorVersion: 'webreceipt-custom-v1',
    },
    {
      id: 'ev_cancel', field: 'terms.cancellation', sourceUrl: source,
      capturedText: firstText('#cancellation'), domPath: '#cancellation',
      screenshotRef: checkoutScreenshot, journeyStep: 2, observedAt: now,
      collectorVersion: 'webreceipt-custom-v1',
    },
  ],
};
