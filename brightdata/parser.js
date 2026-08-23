// WebReceipt custom Scraper Studio Browser Worker parser.
//
// The parser deliberately supports two page families:
// 1. the controlled WebReceipt fixture, where `.total-price` is kept as the
//    historical V1 selector so Fixture V2 can demonstrate real semantic drift;
// 2. arbitrary public commerce/product pages, where candidate prices are ranked
//    by semantic context so shipping/tax/fee amounts are not mistaken for the
//    product price simply because they appear first in the DOM.

const firstText = (selector) => $(selector).first().text_sane();
const firstAttr = (selector, name) => {
  const node = $(selector).first();
  return node && typeof node.attr === 'function' ? String(node.attr(name) || '').trim() : '';
};

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
const fixtureSubject = firstText('[data-testid="offer-name"]');
const fixtureAdvertised = firstText('[data-testid="advertised-price"]');

// ---------------------------------------------------------------------------
// CONTROLLED FIXTURE MODE
// Keep this path stable. The semantic failure is intentionally produced by the
// changed webpage meaning in Fixture V2, not by mutating a parsed value later.
// ---------------------------------------------------------------------------
if (fixtureSubject || fixtureAdvertised) {
  const subject = fixtureSubject || source;
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
    recordType: 'deal_contract',
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
}

// ---------------------------------------------------------------------------
// GENERIC PUBLIC COMMERCE MODE
// A product page is an OFFER observation, not automatically a checkout. We
// extract the product price and any other amount only when its semantic role is
// explicit. Missing shipping/tax/other-fee/final-total fields stay absent instead
// of being synthesized as zero or copied from the product price.
// ---------------------------------------------------------------------------
const CURRENCY_SYMBOLS = new Map([
  ['₹', 'INR'], ['RS', 'INR'], ['RS.', 'INR'], ['INR', 'INR'],
  ['$', 'USD'], ['USD', 'USD'], ['US$', 'USD'],
  ['€', 'EUR'], ['EUR', 'EUR'], ['£', 'GBP'], ['GBP', 'GBP'],
  ['¥', 'JPY'], ['JPY', 'JPY'], ['AED', 'AED'], ['SGD', 'SGD'],
]);

const currencyFrom = (value, fallback = null) => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const upper = raw.toUpperCase();
  if (CURRENCY_SYMBOLS.has(upper)) return CURRENCY_SYMBOLS.get(upper);
  for (const [symbol, code] of CURRENCY_SYMBOLS.entries()) {
    if (raw.includes(symbol) || upper.includes(symbol)) return code;
  }
  return fallback;
};

const elementAttr = (el, name) => {
  const node = $(el);
  return node && typeof node.attr === 'function' ? String(node.attr(name) || '').trim() : '';
};

const semanticScore = (context) => {
  const text = String(context || '').toLowerCase();
  let score = 10;

  if (/itemprop\s*[:=]?\s*price|product:price|product-price|product_price/.test(text)) score += 100;
  if (/\b(product|item)\s+price\b|\b(current|sale|deal|our|special|offer)\s+price\b/.test(text)) score += 75;
  else if (/\bprice\b/.test(text)) score += 28;
  if (/\bproduct\b|\bsku\b|\bvariant\b|\boffer\b/.test(text)) score += 16;

  if (/shipping|delivery|postage|freight/.test(text)) score -= 140;
  if (/\b(?:tax|taxes|gst|vat|service\s*fee|handling\s*fee|platform\s*fee|convenience\s*fee|fee)\b/.test(text)) score -= 120;
  if (/\b(?:final|grand|order|checkout)\s+total\b|\btotal\s+due\b|\bamount\s+due\b/.test(text)) score -= 80;
  if (/\b(?:emi|installment|instalment|monthly|per\s+month|\/month|month)\b/.test(text)) score -= 95;
  if (/\b(?:mrp|list\s*price|original\s*price|regular\s*price|was\s+price|compare\s+at)\b/.test(text)) score -= 55;
  if (/\b(?:save|savings|discount|coupon|cashback|reward)\b/.test(text)) score -= 70;
  return score;
};

const candidates = [];
const addCandidate = ({ amount, currency, captured, selector, context, boost = 0 }) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0 || !currency) return;
  const normalizedContext = String(context || '');
  const score = semanticScore(normalizedContext) + boost;
  const fingerprint = `${numeric}|${currency}|${selector}|${String(captured || '').trim()}`;
  if (candidates.some((item) => item.fingerprint === fingerprint)) return;
  candidates.push({
    amount: numeric,
    currency,
    captured: String(captured || `${currency} ${numeric}`).trim(),
    selector: selector || 'unknown',
    context: normalizedContext,
    score,
    fingerprint,
  });
};

// Strongest source: standard product-price metadata.
const metaPrice = parseMoney(
  firstAttr('meta[property="product:price:amount"]', 'content')
  || firstAttr('meta[property="og:price:amount"]', 'content')
  || firstAttr('meta[itemprop="price"]', 'content')
);
const metaCurrency = currencyFrom(
  firstAttr('meta[property="product:price:currency"]', 'content')
  || firstAttr('meta[property="og:price:currency"]', 'content')
  || firstAttr('meta[itemprop="priceCurrency"]', 'content')
);
if (metaPrice != null && metaCurrency) {
  addCandidate({
    amount: metaPrice,
    currency: metaCurrency,
    captured: `${metaCurrency} ${metaPrice}`,
    selector: 'meta product price',
    context: 'itemprop price product:price product price',
    boost: 100,
  });
}

// JSON-LD / embedded product data. Keep the object path in the semantic context,
// which lets shippingDetails.price lose to Product.offers.price without assuming
// a site-specific selector or numeric value.
const jsonScripts = $('script[type="application/ld+json"]').toArray();
const walkJson = (value, path = [], inheritedCurrency = null) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkJson(item, path.concat(String(index)), inheritedCurrency));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const nodeCurrency = currencyFrom(
    value.priceCurrency || value.currency || value.currencyCode || value.currency_code,
    inheritedCurrency,
  );
  const type = Array.isArray(value['@type']) ? value['@type'].join(' ') : String(value['@type'] || '');
  for (const key of ['finalPrice', 'currentPrice', 'salePrice', 'discountedPrice', 'lowPrice', 'price']) {
    if (!(key in value)) continue;
    const raw = value[key] && typeof value[key] === 'object'
      ? (value[key].amount ?? value[key].value ?? value[key].price)
      : value[key];
    const amount = parseMoney(raw);
    const nestedCurrency = value[key] && typeof value[key] === 'object'
      ? currencyFrom(value[key].currency || value[key].priceCurrency, nodeCurrency)
      : nodeCurrency;
    if (amount != null && nestedCurrency) {
      const context = `${path.join(' ')} ${type} ${key}`;
      addCandidate({
        amount,
        currency: nestedCurrency,
        captured: `${nestedCurrency} ${amount}`,
        selector: 'script[type="application/ld+json"]',
        context,
        boost: /product|offer/i.test(type) ? 80 : 20,
      });
    }
  }
  Object.entries(value).forEach(([key, child]) => {
    if (child && typeof child === 'object') walkJson(child, path.concat(key), nodeCurrency);
  });
};
jsonScripts.forEach((el) => {
  const raw = $(el).text_sane();
  if (!raw) return;
  try { walkJson(JSON.parse(raw), ['jsonld']); } catch { /* malformed JSON-LD is not trusted */ }
});

// DOM candidates from common semantic price hooks. We examine every candidate;
// no `.first()` decision is allowed to decide the business meaning.
const priceSelectors = [
  '[itemprop="price"]',
  '[data-product-price]',
  '[data-sale-price]',
  '[data-price]',
  '[data-testid*="price"]',
  '[class*="price"]',
  '[id*="price"]',
  '[class*="amount"]',
  '[id*="amount"]',
];
priceSelectors.forEach((selector) => {
  $(selector).toArray().forEach((el) => {
    const text = $(el).text_sane();
    const rawAmount = elementAttr(el, 'content')
      || elementAttr(el, 'data-product-price')
      || elementAttr(el, 'data-sale-price')
      || elementAttr(el, 'data-price')
      || text;
    const amount = parseMoney(rawAmount);
    const context = [
      selector,
      text,
      elementAttr(el, 'itemprop'),
      elementAttr(el, 'data-testid'),
      elementAttr(el, 'class'),
      elementAttr(el, 'id'),
      elementAttr(el, 'aria-label'),
    ].filter(Boolean).join(' ');
    const currency = currencyFrom(
      elementAttr(el, 'data-currency') || elementAttr(el, 'data-price-currency') || text,
      metaCurrency,
    );
    addCandidate({ amount, currency, captured: text || rawAmount, selector, context });
  });
});

// Last-resort visible-text scan. Each amount gets sentence/clause-local context;
// this avoids a nearby shipping label contaminating a separate product price.
// Money tokens are forced to end on a digit so sentence punctuation is never
// consumed as part of the amount.
const bodyText = firstText('body');
const visibleMoney = /(?:₹|Rs\.?|INR|USD|US\$|\$|EUR|€|GBP|£|JPY|¥|AED|SGD)\s*[0-9](?:[0-9\s,.'’]*[0-9])?|[0-9](?:[0-9\s,.'’]*[0-9])?\s*(?:INR|USD|EUR|GBP|JPY|AED|SGD)/gi;
const localMoneyContext = (text, index, length) => {
  const startMarkers = ['.', '!', '?', '\n', '|', '•', '·'];
  const endMarkers = startMarkers;
  let start = Math.max(0, index - 120);
  let end = Math.min(text.length, index + length + 120);
  for (const marker of startMarkers) {
    const found = text.lastIndexOf(marker, index - 1);
    if (found >= 0) start = Math.max(start, found + 1);
  }
  for (const marker of endMarkers) {
    const found = text.indexOf(marker, index + length);
    if (found >= 0) end = Math.min(end, found);
  }
  return text.slice(start, end).trim();
};
for (const match of bodyText.matchAll(visibleMoney)) {
  const captured = match[0];
  const amount = parseMoney(captured);
  const currency = currencyFrom(captured, metaCurrency);
  const index = match.index || 0;
  const context = localMoneyContext(bodyText, index, captured.length);
  addCandidate({ amount, currency, captured, selector: 'visible text', context });
}

candidates.sort((a, b) => b.score - a.score || b.amount - a.amount);
const selected = candidates[0];
if (!selected || selected.score < 0) {
  throw new Error('No semantically credible product price was found on this public page.');
}

const roleCandidate = (pattern) => candidates
  .filter((item) => item.currency === selected.currency && pattern.test(String(item.context || '').toLowerCase()))
  .sort((a, b) => b.score - a.score || b.amount - a.amount)[0] || null;
const shipping = roleCandidate(/shipping|delivery|postage|freight/);
const taxes = roleCandidate(/\b(?:tax|taxes|gst|vat)\b/);
const otherFees = roleCandidate(/\b(?:service|handling|platform|convenience|processing|booking|other|mandatory)\s+fees?\b/);
const finalTotal = roleCandidate(/\b(?:final|grand|order|checkout)\s+total\b|\btotal\s+due\b|\bamount\s+due\b/);
const discount = roleCandidate(/\b(?:discount|coupon|cashback|savings?)\b/);

const subject = firstText('h1')
  || firstAttr('meta[property="og:title"]', 'content')
  || firstText('title')
  || source;
const brand = firstAttr('meta[property="product:brand"]', 'content')
  || firstText('[itemprop="brand"]')
  || firstAttr('[itemprop="brand"]', 'content');
const model = firstText('[itemprop="model"]') || firstAttr('[itemprop="model"]', 'content');
const sku = firstText('[itemprop="sku"]') || firstAttr('[itemprop="sku"]', 'content');
const offerScreenshot = screenshotRef('offer_screenshot', 'offer_screenshot');
const collectorVersion = 'webreceipt-custom-commerce-v4';

const product = { name: subject };
if (brand) product.brand = brand;
if (model) product.model = model;
if (sku) product.sku = sku;

const commercial = {
  productPrice: selected.amount,
  currency: selected.currency,
};
if (shipping) commercial.shippingFee = shipping.amount;
if (taxes) commercial.taxes = taxes.amount;
if (otherFees) commercial.otherFees = otherFees.amount;
if (discount) commercial.discount = discount.amount;
if (finalTotal) commercial.finalTotal = finalTotal.amount;

const evidence = [
  {
    id: 'ev_product_price', field: 'commercial.productPrice', sourceUrl: source,
    capturedText: selected.captured, domPath: selected.selector,
    screenshotRef: offerScreenshot, journeyStep: 1, observedAt: now, collectorVersion,
  },
  {
    id: 'ev_offer', field: 'offer.advertisedPrice', sourceUrl: source,
    capturedText: selected.captured, domPath: selected.selector,
    screenshotRef: offerScreenshot, journeyStep: 1, observedAt: now, collectorVersion,
  },
];
const addRoleEvidence = (id, field, item) => {
  if (!item) return;
  evidence.push({
    id, field, sourceUrl: source, capturedText: item.captured, domPath: item.selector,
    screenshotRef: offerScreenshot, journeyStep: 1, observedAt: now, collectorVersion,
  });
};
addRoleEvidence('ev_shipping', 'commercial.shippingFee', shipping);
addRoleEvidence('ev_tax', 'commercial.taxes', taxes);
addRoleEvidence('ev_other_fees', 'commercial.otherFees', otherFees);
addRoleEvidence('ev_discount', 'commercial.discount', discount);
addRoleEvidence('ev_final_total', 'commercial.finalTotal', finalTotal);

return {
  recordType: 'product_observation',
  subject,
  targetUrl: source,
  observedAt: now,
  locale: selected.currency === 'INR' ? 'en-IN' : 'en',
  currency: selected.currency,
  collectorVersion,
  worker: 'browser',
  product,
  commercial,
  offer: {
    advertisedPrice: selected.amount,
    claims: [],
  },
  journey: [
    {label: 'Public product page', url: source, displayedPrice: selected.amount, evidenceId: 'ev_product_price'},
  ],
  evidence,
};
