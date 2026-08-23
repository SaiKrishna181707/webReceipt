import { assertPublicTarget } from '../domain/target-policy.js';
import { extractPublicPageObservation } from './public-web.js';
import { PublicWebCollector as ProductionPublicWebCollector } from './public-web-production.js';
import { selectVisibleCommercePrice } from './commerce-price.js';

const MIN_VISIBLE_PRICE_SCORE = 0;

function looksLikeProductDetail(rawUrl) {
  try {
    const pathname = new URL(rawUrl).pathname.toLowerCase();
    return /\/(?:p|t|product|products|item|dp)\//.test(pathname);
  } catch {
    return false;
  }
}

function collectorVersion(response) {
  return response.via === 'brightdata-unlocker' ? 'public-web-brightdata-v3' : 'public-web-direct-v3';
}

function ambiguousError(ranked) {
  const examples = ranked.candidates
    .slice(0, 3)
    .map((item) => `${item.currency} ${item.amount}`)
    .join(', ');
  const error = new Error(
    `Multiple competing product prices were found on this page${examples ? ` (${examples})` : ''}. Paste a single product-detail URL so WebReceipt can identify one unambiguous product price.`,
  );
  error.status = 422;
  error.code = 'ambiguous_page';
  return error;
}

function unsupportedPriceError() {
  const error = new Error(
    'The fetched page exposed promotional currency amounts but no trustworthy product price. Paste the product-detail URL, or enable the Bright Data public live fallback for rendered commerce pages.',
  );
  error.status = 422;
  error.code = 'unsupported_page';
  return error;
}

function unsupportedMutationError() {
  const error = new Error(
    'Live public URLs are observed read-only. WebReceipt does not synthesize scraper mutations on third-party pages; real self-healing requires the Bright Data live workflow.',
  );
  error.status = 400;
  error.code = 'unsupported_mode';
  return error;
}

function priceEvidence(observation) {
  return observation.evidence?.find((item) => item.field === 'offer.advertisedPrice')
    || observation.evidence?.find((item) => item.field === 'checkout.basePrice')
    || observation.evidence?.find((item) => item.field === 'checkout.finalTotal')
    || null;
}

function productObservationFrom(base, { candidate, version, sourceUrl }) {
  const baseAmount = Number(base.offer?.advertisedPrice ?? base.checkout?.basePrice ?? base.checkout?.finalTotal);
  const baseCurrency = String(base.currency || '').trim().toUpperCase();
  const useVisible = Boolean(candidate && candidate.score >= MIN_VISIBLE_PRICE_SCORE);
  const amount = useVisible ? Number(candidate.amount) : baseAmount;
  const currency = useVisible ? candidate.currency : baseCurrency;
  if (!Number.isFinite(amount) || amount < 0 || !/^[A-Z]{3}$/.test(currency)) throw unsupportedPriceError();

  const priorEvidence = priceEvidence(base);
  const capturedText = useVisible
    ? String(candidate.capturedText || `${currency} ${amount}`).trim()
    : String(priorEvidence?.capturedText || `${currency} ${amount}`).trim();
  if (!capturedText) throw unsupportedPriceError();

  const changed = useVisible && (
    baseCurrency !== currency
    || Math.abs(Number(base.checkout?.finalTotal ?? baseAmount) - amount) > 0.000001
  );
  const effectiveVersion = changed ? `${version}-visible-price-reconciled` : version;
  const observedAt = base.observedAt || new Date().toISOString();
  const targetUrl = sourceUrl || base.targetUrl;
  const subject = String(base.subject || targetUrl || 'Public product').trim();
  const screenshotRef = priorEvidence?.screenshotRef || 'not-captured';
  const domPath = useVisible ? 'visible-commerce-price' : (priorEvidence?.domPath || 'structured-commerce-price');

  return {
    recordType: 'product_observation',
    subject,
    targetUrl,
    observedAt,
    locale: base.locale || (currency === 'INR' ? 'en-IN' : 'en'),
    currency,
    collectorVersion: `${effectiveVersion}-product-observation`,
    worker: 'http',
    product: { name: subject },
    commercial: {
      productPrice: amount,
      currency,
    },
    offer: {
      advertisedPrice: amount,
      claims: Array.isArray(base.offer?.claims) ? base.offer.claims : [],
    },
    journey: [
      { label: 'Public product page', url: targetUrl, displayedPrice: amount, evidenceId: 'ev_product_price' },
    ],
    evidence: [
      {
        id: 'ev_product_price',
        field: 'commercial.productPrice',
        sourceUrl: targetUrl,
        capturedText,
        domPath,
        screenshotRef,
        journeyStep: 1,
        observedAt,
        collectorVersion: `${effectiveVersion}-product-observation`,
      },
      {
        id: 'ev_offer',
        field: 'offer.advertisedPrice',
        sourceUrl: targetUrl,
        capturedText,
        domPath,
        screenshotRef,
        journeyStep: 1,
        observedAt,
        collectorVersion: `${effectiveVersion}-product-observation`,
      },
    ],
  };
}

export class PublicWebCollector extends ProductionPublicWebCollector {
  async collect({ url, mutation = 'healthy' } = {}) {
    if (!url) throw new Error('Public web collection requires a URL input.');
    if (mutation !== 'healthy') throw unsupportedMutationError();

    this.lastTargetUrl = assertPublicTarget(url);
    this.fallbackCurrency = null;
    try {
      const response = await this.requestHtml(this.lastTargetUrl);
      const productDetail = looksLikeProductDetail(this.lastTargetUrl);
      const ranked = selectVisibleCommercePrice(response.html, { productDetail });

      // Catalog/search pages can contain several equally plausible product
      // prices. Fail closed instead of choosing one at random.
      if (ranked.ambiguous) throw ambiguousError(ranked);

      const version = collectorVersion(response);
      const base = extractPublicPageObservation(response.html, {
        sourceUrl: response.sourceUrl,
        collectorVersion: version,
      });

      // A negative visible candidate such as "₹500 off" must not be elevated
      // into a product price merely because the legacy fallback parser can turn
      // the first currency amount into a complete-looking checkout object.
      if (ranked.candidate && ranked.candidate.score < MIN_VISIBLE_PRICE_SCORE) {
        const sameAmount = Math.abs(Number(base.checkout?.finalTotal) - ranked.candidate.amount) < 0.000001;
        const sameCurrency = String(base.currency || '').toUpperCase() === ranked.candidate.currency;
        if (sameAmount && sameCurrency) throw unsupportedPriceError();
      }

      // Crucially, a product-detail page proves an offer price, not a checkout.
      // Return a product_observation and let WebReceipt keep it unsealed until a
      // real final payable total is actually observed.
      return productObservationFrom(base, {
        candidate: ranked.candidate,
        version,
        sourceUrl: response.sourceUrl,
      });
    } finally {
      this.fallbackCurrency = null;
    }
  }

  async heal() {
    throw unsupportedMutationError();
  }

  async approveHeal() {
    throw unsupportedMutationError();
  }

  async rejectHeal() {
    throw unsupportedMutationError();
  }
}
