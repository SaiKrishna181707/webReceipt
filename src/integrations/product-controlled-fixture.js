import { renderProductFixture } from '../product-fixture-page.js';

const DEFAULT_TARGET = 'https://demo.webreceipt.dev/fixture/product';
const OBSERVED_AT = '2026-08-23T06:45:00.000Z';
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

function requiredMoney(value, label) {
  const amount = parseMoney(value);
  if (!Number.isFinite(amount)) throw new Error(`Product fixture scraper could not extract ${label}.`);
  return amount;
}

function stripLabel(value, label) {
  return String(value || '').replace(new RegExp(`^${escapeRegExp(label)}:\\s*`, 'i'), '').trim();
}

export function scrapeProductControlledFixture({
  websiteVersion = 'v1',
  scraperVersion = 'v1',
  targetUrl = DEFAULT_TARGET,
} = {}) {
  if (!['v1', 'v2'].includes(websiteVersion)) throw new Error(`Unsupported product fixture version: ${websiteVersion}`);
  if (!['v1', 'v2'].includes(scraperVersion)) throw new Error(`Unsupported product scraper version: ${scraperVersion}`);

  const html = renderProductFixture(websiteVersion);
  const subject = captureByAttribute(html, 'data-testid', 'offer-name');
  const advertisedText = captureByAttribute(html, 'data-testid', 'advertised-price');
  const baseText = captureByAttribute(html, 'data-testid', 'base-price');
  const shippingText = captureByAttribute(html, 'data-testid', 'shipping-fee');
  const otherFeeText = captureByAttribute(html, 'data-testid', 'other-fee');
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

  const productPrice = requiredMoney(advertisedText, 'product price');
  const basePrice = requiredMoney(baseText, 'checkout product price');
  const shippingFee = requiredMoney(shippingText, 'shipping fee');
  const otherFees = requiredMoney(otherFeeText, 'other fee');
  const taxes = requiredMoney(taxText, 'taxes');
  const finalTotal = requiredMoney(finalText, 'final total');
  const mandatoryFees = shippingFee + otherFees;
  const collectorVersion = `product-fixture-${websiteVersion}/scraper-${scraperVersion}`;
  const checkoutUrl = `${targetUrl}#order-summary`;

  const evidence = [
    ['ev_product', 'offer.advertisedPrice', advertisedText, targetUrl, '[data-testid="advertised-price"]', 1],
    ['ev_base', 'checkout.basePrice', baseText, checkoutUrl, '[data-testid="base-price"]', 2],
    ['ev_fees', 'checkout.mandatoryFees', `${shippingText} + ${otherFeeText}`, checkoutUrl, '[data-testid="shipping-fee"],[data-testid="other-fee"]', 2],
    ['ev_tax', 'checkout.taxes', taxText, checkoutUrl, '[data-testid="tax"]', 2],
    ['ev_total', 'checkout.finalTotal', finalEvidenceText, checkoutUrl, finalSelector, 2],
    ['ev_terms', 'terms.cancellation', cancellationText, checkoutUrl, '#cancellation', 2],
  ].map(([id, field, capturedText, sourceUrl, domPath, journeyStep]) => ({
    id,
    field,
    capturedText,
    sourceUrl,
    domPath,
    screenshotRef: `screenshots/product-${websiteVersion}-step-${journeyStep}.png`,
    journeyStep,
    observedAt: OBSERVED_AT,
    collectorVersion,
  }));

  return {
    recordType: 'deal_contract',
    dealId: 'deal_nike_pegasus_demo',
    subject,
    targetUrl,
    observedAt: OBSERVED_AT,
    locale: 'en-IN',
    currency: 'INR',
    collectorId: COLLECTOR_ID,
    collectorVersion,
    worker: 'browser',
    product: {
      name: subject,
      brand: captureByAttribute(html, 'data-testid', 'product-brand'),
      model: captureByAttribute(html, 'data-testid', 'product-model'),
      sku: captureByAttribute(html, 'data-testid', 'product-sku'),
    },
    commercial: {
      productPrice,
      currency: 'INR',
      shippingFee,
      taxes,
      otherFees,
      discount: 0,
      finalTotal,
    },
    offer: {
      advertisedPrice: productPrice,
      claims: captureAllByClass(html, 'claim'),
    },
    checkout: {
      basePrice,
      feeItems: [
        { label: 'Shipping', amount: shippingFee, required: true },
        { label: 'Other mandatory fees', amount: otherFees, required: true },
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
      { label: 'Product', url: targetUrl, displayedPrice: productPrice, evidenceId: 'ev_product' },
      { label: 'Order summary', url: checkoutUrl, displayedPrice: finalTotal, evidenceId: 'ev_total' },
    ],
    evidence,
  };
}
