import { renderHotelFixture } from '../fixture-page.js';

const DEFAULT_TARGET = 'https://demo.webreceipt.dev/hotel/ocean-house';
const OBSERVED_AT = '2026-08-17T14:30:00.000Z';
const COLLECTOR_ID = 'c_webreceipt_demo';

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cleanText = (value) => String(value || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

function captureByAttribute(html, attribute, value) {
  const pattern = new RegExp(
    `<([a-z0-9]+)\\b[^>]*\\b${escapeRegExp(attribute)}=["']${escapeRegExp(value)}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    'i',
  );
  return cleanText(pattern.exec(html)?.[2] ?? '');
}

function captureByClass(html, className) {
  const pattern = new RegExp(
    `<([a-z0-9]+)\\b[^>]*\\bclass=["'][^"']*\\b${escapeRegExp(className)}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    'i',
  );
  return cleanText(pattern.exec(html)?.[2] ?? '');
}

function captureAllByClass(html, className) {
  const pattern = new RegExp(
    `<([a-z0-9]+)\\b[^>]*\\bclass=["'][^"']*\\b${escapeRegExp(className)}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    'gi',
  );
  const values = [];
  let match;
  while ((match = pattern.exec(html))) {
    const text = cleanText(match[2]);
    if (text) values.push(text);
  }
  return values;
}

function parseMoney(value) {
  const raw = String(value || '').replace(/[^0-9.-]/g, '');
  if (!raw) return null;
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : null;
}

function stripLabel(value, label) {
  return String(value || '').replace(new RegExp(`^${escapeRegExp(label)}:\\s*`, 'i'), '').trim();
}

function requiredMoney(value, label) {
  const amount = parseMoney(value);
  if (!Number.isFinite(amount)) throw new Error(`Controlled fixture scraper could not extract ${label}.`);
  return amount;
}

export function scrapeControlledFixture({
  websiteVersion = 'v1',
  scraperVersion = 'v1',
  targetUrl = DEFAULT_TARGET,
} = {}) {
  if (!['v1', 'v2'].includes(websiteVersion)) throw new Error(`Unsupported controlled fixture version: ${websiteVersion}`);
  if (!['v1', 'v2'].includes(scraperVersion)) throw new Error(`Unsupported controlled scraper version: ${scraperVersion}`);

  const html = renderHotelFixture(websiteVersion);
  const subject = captureByAttribute(html, 'data-testid', 'offer-name');
  const advertisedText = captureByAttribute(html, 'data-testid', 'advertised-price');
  const baseText = captureByAttribute(html, 'data-testid', 'base-price');
  const propertyFeeText = captureByClass(html, 'fee-property');
  const serviceFeeText = captureByClass(html, 'fee-service');
  const taxText = captureByAttribute(html, 'data-testid', 'tax');
  const cancellationText = captureByAttribute(html, 'id', 'cancellation');
  const refundabilityText = captureByAttribute(html, 'id', 'refundability');
  const paymentText = captureByAttribute(html, 'id', 'payment-timing');
  const inclusionText = captureByAttribute(html, 'id', 'inclusions');
  const finalSelector = scraperVersion === 'v2' ? '[data-testid="order-total"]' : '.total-price';
  const finalText = scraperVersion === 'v2'
    ? captureByAttribute(html, 'data-testid', 'order-total')
    : captureByClass(html, 'total-price');
  const finalEvidenceText = websiteVersion === 'v2' && scraperVersion === 'v1'
    ? captureByClass(html, 'legacy')
    : finalText;

  const advertisedPrice = requiredMoney(advertisedText, 'advertised price');
  const basePrice = requiredMoney(baseText, 'base price');
  const propertyFee = requiredMoney(propertyFeeText, 'property fee');
  const serviceFee = requiredMoney(serviceFeeText, 'service fee');
  const taxes = requiredMoney(taxText, 'tax');
  const finalTotal = requiredMoney(finalText, 'final total');
  const mandatoryFees = propertyFee + serviceFee;
  const collectorVersion = `fixture-${websiteVersion}/scraper-${scraperVersion}`;
  const checkoutUrl = `${targetUrl}/checkout`;

  const evidence = [
    ['ev_1', 'offer.advertisedPrice', advertisedText, `${targetUrl}/search`, '[data-testid="advertised-price"]', 1],
    ['ev_2', 'checkout.basePrice', baseText, checkoutUrl, '[data-testid="base-price"]', 3],
    ['ev_3', 'checkout.mandatoryFees', `${propertyFeeText} + ${serviceFeeText}`, checkoutUrl, '.fee-property,.fee-service', 3],
    ['ev_4', 'checkout.finalTotal', finalEvidenceText, checkoutUrl, finalSelector, 4],
    ['ev_5', 'terms.cancellation', cancellationText, checkoutUrl, '#cancellation', 4],
  ].map(([id, field, capturedText, sourceUrl, domPath, journeyStep]) => ({
    id,
    field,
    capturedText,
    sourceUrl,
    domPath,
    screenshotRef: `screenshots/${websiteVersion}-step-${journeyStep}.png`,
    journeyStep,
    observedAt: OBSERVED_AT,
    collectorVersion,
  }));

  return {
    dealId: 'deal_ocean_house',
    subject,
    targetUrl,
    observedAt: OBSERVED_AT,
    locale: 'en-IN',
    currency: 'INR',
    collectorId: COLLECTOR_ID,
    collectorVersion,
    worker: 'browser',
    offer: {
      advertisedPrice,
      claims: captureAllByClass(html, 'claim'),
    },
    checkout: {
      basePrice,
      feeItems: [
        { label: 'Property fee', amount: propertyFee, required: true },
        { label: 'Service fee', amount: serviceFee, required: true },
      ],
      mandatoryFees,
      taxes,
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
      { label: 'Search', url: `${targetUrl}/search`, displayedPrice: advertisedPrice, evidenceId: 'ev_1' },
      { label: 'Property', url: targetUrl, displayedPrice: advertisedPrice, evidenceId: 'ev_1' },
      { label: 'Room', url: `${targetUrl}/room`, displayedPrice: basePrice, evidenceId: 'ev_2' },
      { label: 'Checkout', url: checkoutUrl, displayedPrice: finalTotal, evidenceId: 'ev_4' },
    ],
    evidence,
  };
}
