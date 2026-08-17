// Initial parser intentionally uses `.total-price` for finalTotal.
// Fixture v1: correct. Fixture v2: `.total-price` still exists but means SUBTOTAL.
// WebReceipt's semantic integrity engine detects the silent corruption and asks
// Scraper Studio Self-Healing to repair this parser by field meaning.

const number = (selector) => {
  const text = $(selector).first().text_sane();
  const n = Number(text.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const text = (selector) => $(selector).first().text_sane();
const now = new Date().toISOString();
const source = location.href;
const advertised = number('[data-testid="advertised-price"]');
const base = number('[data-testid="base-price"]');
const property = number('.fee-property');
const service = number('.fee-service');
const tax = number('[data-testid="tax"]');
const final = number('.total-price'); // <-- deliberate semantic failure after V2 redesign
const screenshot = parser.page_screenshot || null;

return {
  subject: 'Ocean House · 1 night · Deluxe Room',
  targetUrl: source,
  observedAt: now,
  locale: 'en-IN',
  currency: 'INR',
  collectorVersion: 'fixture-v1-parser',
  worker: 'browser',
  offer: { advertisedPrice: advertised, claims: ['Free cancellation', 'Breakfast included'] },
  checkout: {
    basePrice: base,
    feeItems: [{label:'Property fee', amount:property}, {label:'Service fee', amount:service}],
    mandatoryFees: property + service,
    taxes: tax,
    optionalAddons: 0,
    finalTotal: final
  },
  terms: {
    cancellation: text('#cancellation').replace(/^Cancellation:\s*/i, ''),
    refundability: text('#refundability').replace(/^Refundability:\s*/i, ''),
    paymentTiming: text('#payment-timing').replace(/^Payment:\s*/i, ''),
    inclusions: [text('#inclusions').replace(/^Includes:\s*/i, '')]
  },
  journey: [
    {label:'Offer', url:source, displayedPrice:advertised, evidenceId:'ev_offer'},
    {label:'Checkout', url:source, displayedPrice:final, evidenceId:'ev_total'}
  ],
  evidence: [
    {id:'ev_offer', field:'offer.advertisedPrice', sourceUrl:source, capturedText:text('[data-testid="advertised-price"]'), domPath:'[data-testid="advertised-price"]', screenshotRef:screenshot, journeyStep:1, observedAt:now, collectorVersion:'fixture-v1-parser'},
    {id:'ev_base', field:'checkout.basePrice', sourceUrl:source, capturedText:text('[data-testid="base-price"]'), domPath:'[data-testid="base-price"]', screenshotRef:screenshot, journeyStep:2, observedAt:now, collectorVersion:'fixture-v1-parser'},
    {id:'ev_fees', field:'checkout.mandatoryFees', sourceUrl:source, capturedText:`${text('.fee-property')} + ${text('.fee-service')}`, domPath:'.fee-property,.fee-service', screenshotRef:screenshot, journeyStep:2, observedAt:now, collectorVersion:'fixture-v1-parser'},
    {id:'ev_total', field:'checkout.finalTotal', sourceUrl:source, capturedText:text('.total-price'), domPath:'.total-price', screenshotRef:screenshot, journeyStep:2, observedAt:now, collectorVersion:'fixture-v1-parser'},
    {id:'ev_cancel', field:'terms.cancellation', sourceUrl:source, capturedText:text('#cancellation'), domPath:'#cancellation', screenshotRef:screenshot, journeyStep:2, observedAt:now, collectorVersion:'fixture-v1-parser'}
  ]
};
