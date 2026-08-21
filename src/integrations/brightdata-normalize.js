const FLAT_MARKERS = [
  'advertised_price', 'base_price', 'property_fee', 'service_fee', 'tax',
  'order_total', 'offer_name', 'cancellation_terms', 'refundability',
  'payment_timing', 'inclusions', 'journey_state',
];

function text(value) {
  return String(value ?? '').trim();
}

function moneyAmount(value, label) {
  const candidate = value && typeof value === 'object' && 'value' in value
    ? value.value : value;
  const amount = Number(candidate);
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error(`Bright Data flat output has invalid ${label}.`);
  return amount;
}

function moneyCurrency(value, fallback = '') {
  const currency = value && typeof value === 'object' ? text(value.currency) : '';
  return currency || fallback;
}

function stripLabel(value, label) {
  return text(value).replace(new RegExp(`^${label}:\\s*`, 'i'), '').trim();
}

function moneyEvidenceText(label, field, currency) {
  const amount = moneyAmount(field, label);
  const symbol = field && typeof field === 'object' ? text(field.symbol) : '';
  return `Bright Data structured output: ${symbol ? `${symbol}` : `${currency} `}${amount}`;
}

function evidence({ id, field, sourceUrl, capturedText, journeyStep, collectorVersion }) {
  return {
    id,
    field,
    sourceUrl,
    capturedText,
    screenshotRef: null,
    domPath: null,
    journeyStep,
    observedAt: new Date().toISOString(),
    collectorVersion,
  };
}

function isCanonical(record) {
  return Boolean(record?.subject && record?.offer && record?.checkout && record?.terms);
}

function isFlat(record) {
  return FLAT_MARKERS.some((key) => Object.prototype.hasOwnProperty.call(record, key));
}

/**
 * Convert the generated Scraper Studio shape returned by the verified production
 * collector into WebReceipt's canonical observation input. Checked-in custom
 * Browser Worker output is already canonical and passes through unchanged.
 *
 * Evidence created here is deliberately labelled as Bright Data structured-output
 * provenance. It does not pretend a screenshot/DOM selector was returned by a
 * generated collector when it was not.
 */
export function normalizeBrightDataRecord(record, { targetUrl, collectorId } = {}) {
  if (!record || typeof record !== 'object')
    throw new Error('Bright Data returned no structured observation.');

  const errorMessage = text(record.error);
  const errorCode = text(record.error_code);
  if (errorMessage || errorCode) {
    const code = errorCode ? ` (${errorCode})` : '';
    throw new Error(`Bright Data collector output error${code}: ${errorMessage || 'unknown collector failure'}`);
  }

  if (isCanonical(record)) {
    return {
      ...record,
      ...(!record.targetUrl && targetUrl ? { targetUrl } : {}),
      ...(!record.collectorId && collectorId ? { collectorId } : {}),
    };
  }

  if (!isFlat(record)) return record;

  const sourceUrl = text(record.input?.url) || text(targetUrl);
  if (!sourceUrl) throw new Error('Bright Data flat output is missing the source URL.');

  const advertised = moneyAmount(record.advertised_price, 'advertised_price');
  const base = moneyAmount(record.base_price, 'base_price');
  const propertyFee = moneyAmount(record.property_fee, 'property_fee');
  const serviceFee = moneyAmount(record.service_fee, 'service_fee');
  const taxes = moneyAmount(record.tax, 'tax');
  const finalTotal = moneyAmount(record.order_total, 'order_total');
  const currency = moneyCurrency(record.order_total,
    moneyCurrency(record.base_price, moneyCurrency(record.advertised_price, 'INR')));
  const collectorVersion = 'brightdata-generated-flat-v1';
  const subject = text(record.offer_name) || sourceUrl;
  const cancellation = stripLabel(record.cancellation_terms, 'Cancellation');
  const refundability = stripLabel(record.refundability, 'Refundability');
  const paymentTiming = stripLabel(record.payment_timing, 'Payment');
  const inclusion = stripLabel(record.inclusions, 'Includes');
  const finalJourneyLabel = text(record.journey_state) || 'Checkout';
  const observedAt = new Date().toISOString();

  const provenance = [
    evidence({
      id: 'ev_offer', field: 'offer.advertisedPrice', sourceUrl,
      capturedText: moneyEvidenceText('advertised_price', record.advertised_price, currency),
      journeyStep: 1, collectorVersion,
    }),
    evidence({
      id: 'ev_base', field: 'checkout.basePrice', sourceUrl,
      capturedText: moneyEvidenceText('base_price', record.base_price, currency),
      journeyStep: 2, collectorVersion,
    }),
    evidence({
      id: 'ev_total', field: 'checkout.finalTotal', sourceUrl,
      capturedText: moneyEvidenceText('order_total', record.order_total, currency),
      journeyStep: 2, collectorVersion,
    }),
    evidence({
      id: 'ev_cancel', field: 'terms.cancellation', sourceUrl,
      capturedText: text(record.cancellation_terms) || cancellation,
      journeyStep: 2, collectorVersion,
    }),
  ];

  return {
    subject,
    targetUrl: sourceUrl,
    observedAt,
    locale: 'en-IN',
    currency,
    collectorId,
    collectorVersion,
    worker: 'browser',
    offer: {
      advertisedPrice: advertised,
      claims: inclusion ? [inclusion] : [],
    },
    checkout: {
      basePrice: base,
      feeItems: [
        { label: 'Property fee', amount: propertyFee, required: true },
        { label: 'Service fee', amount: serviceFee, required: true },
      ],
      mandatoryFees: propertyFee + serviceFee,
      taxes,
      optionalAddons: 0,
      discounts: 0,
      finalTotal,
    },
    terms: {
      cancellation,
      refundability,
      paymentTiming,
      inclusions: inclusion ? [inclusion] : [],
    },
    journey: [
      { label: 'Offer', url: sourceUrl, displayedPrice: advertised, evidenceId: 'ev_offer' },
      { label: finalJourneyLabel, url: sourceUrl, displayedPrice: finalTotal, evidenceId: 'ev_total' },
    ],
    evidence: provenance.map((item) => ({ ...item, observedAt })),
  };
}
