// WebReceipt custom Scraper Studio Browser Worker parser.
//
// IMPORTANT DEMO PROPERTY:
// The initial production parser intentionally uses `.total-price` as finalTotal.
// Fixture V1: `.total-price` means the amount due (correct).
// Fixture V2: `.total-price` still matches, but now means SUBTOTAL (silently wrong).
// The true total is moved/restructured and split across child nodes. WebReceipt's
// semantic contract catches the plausible wrong value, then verifies the
// Scraper Studio repair preview before approving it.

const firstText = (selector) => $(selector).first().text_sane();

const parseMoney = (value) => {
  let raw = String(value || '').replace(/\s+/g, '').replace(/[^0-9,.-]/g, '');
  if (!raw) return null;
  const negative = raw.startsWith('-');
  raw = raw.replace(/-/g, '');
  const comma = raw.lastIndexOf(',');
  const dot = raw.lastIndexOf('.');
  const lastSep = Math.max(comma, dot);
  let normalized;
  if (lastSep >= 0) {
    const decimals = raw.length - lastSep - 1;
    const useDecimal = decimals > 0 && decimals <= 2;
    if (useDecimal) {
      const integer = raw.slice(0, lastSep).replace(/[.,]/g, '');
      normalized = `${integer}.${raw.slice(lastSep + 1).replace(/[.,]/g, '')}`;
    } else {
      normalized = raw.replace(/[.,]/g, '');
    }
  } else {
    normalized = raw;
  }
  const amount = Number(`${negative ? '-' : ''}${normalized}`);
  return Number.isFinite(amount) ? amount : null;
};

const money = (selector) => parseMoney(firstText(selector));
const screenshotRef = (field, fallback) => {
  const value = parser[field];
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object')
    return value.remote_url || value.url || value.file_path || fallback;
  return fallback;
};

const stripLabel = (value, label) => String(value || '').replace(new RegExp(`^${label}:\\s*`, 'i'), '').trim();
const now = new Date().toISOString();
const source = location.href;
const subject = firstText('[data-testid="offer-name"]') || source;
const advertised = money('[data-testid="advertised-price"]');
const base = money('[data-testid="base-price"]');
const propertyFee = money('.fee-property');
const serviceFee = money('.fee-service');
const tax = money('[data-testid="tax"]');
const finalTotal = money('.total-price'); // deliberate wrong-but-valid failure after V2 redesign
const offerScreenshot = screenshotRef('offer_screenshot', 'offer_screenshot');
const checkoutScreenshot = screenshotRef('checkout_screenshot', 'checkout_screenshot');
const claims = $('.claim').toArray().map((el) => $(el).text_sane()).filter(Boolean);
const cancellationText = firstText('#cancellation');
const refundabilityText = firstText('#refundability');
const paymentText = firstText('#payment-timing');
const inclusionText = firstText('#inclusions');

return {
  subject,
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
    cancellation: stripLabel(cancellationText, 'Cancellation'),
    refundability: stripLabel(refundabilityText, 'Refundability'),
    paymentTiming: stripLabel(paymentText, 'Payment'),
    inclusions: [stripLabel(inclusionText, 'Includes')].filter(Boolean),
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
      id: 'ev_tax', field: 'checkout.taxes', sourceUrl: source,
      capturedText: firstText('[data-testid="tax"]'),
      domPath: '[data-testid="tax"]', screenshotRef: checkoutScreenshot,
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
      capturedText: cancellationText, domPath: '#cancellation',
      screenshotRef: checkoutScreenshot, journeyStep: 2, observedAt: now,
      collectorVersion: 'webreceipt-custom-v1',
    },
  ],
};
