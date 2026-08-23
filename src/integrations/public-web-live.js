import { assertPublicTarget } from '../domain/target-policy.js';
import { extractPublicPageObservation } from './public-web.js';
import { PublicWebCollector as ProductionPublicWebCollector } from './public-web-production.js';
import { selectVisibleCommercePrice } from './commerce-price.js';

const PRICE_EVIDENCE_FIELDS = new Set(['offer.advertisedPrice', 'checkout.basePrice', 'checkout.finalTotal']);
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
  return response.via === 'brightdata-unlocker' ? 'public-web-brightdata-v2' : 'public-web-direct-v2';
}

function restoreFallbackCurrency(observation, currency) {
  if (!currency || observation.currency === currency) return observation;
  return {
    ...observation,
    currency,
    evidence: observation.evidence.map((item) => PRICE_EVIDENCE_FIELDS.has(item.field)
      ? { ...item, capturedText: String(item.capturedText || '').replace(/\bUSD\b/g, currency) }
      : item),
  };
}

function reconcileVisiblePrice(observation, candidate, version) {
  if (!candidate || candidate.score < MIN_VISIBLE_PRICE_SCORE) return observation;
  const amount = candidate.amount;
  const currency = candidate.currency;
  const changed = observation.currency !== currency
    || Math.abs(Number(observation.checkout.finalTotal) - amount) > 0.000001;
  const evidenceText = candidate.capturedText || `${currency} ${amount}`;

  return {
    ...observation,
    currency,
    collectorVersion: changed ? `${version}-visible-price-reconciled` : version,
    offer: { ...observation.offer, advertisedPrice: amount },
    checkout: {
      ...observation.checkout,
      basePrice: amount,
      mandatoryFees: 0,
      taxes: 0,
      optionalAddons: 0,
      discounts: 0,
      feeItems: [],
      finalTotal: amount,
    },
    journey: observation.journey.map((step) => ({ ...step, displayedPrice: amount })),
    evidence: observation.evidence.map((item) => PRICE_EVIDENCE_FIELDS.has(item.field)
      ? { ...item, capturedText: evidenceText, collectorVersion: changed ? `${version}-visible-price-reconciled` : version }
      : { ...item, collectorVersion: version }),
  };
}

function ambiguousError(ranked) {
  const examples = ranked.candidates
    .slice(0, 3)
    .map((item) => `${item.currency} ${item.amount}`)
    .join(', ');
  const error = new Error(
    `Multiple competing product prices were found on this page${examples ? ` (${examples})` : ''}. Paste a single product-detail URL so WebReceipt can seal one unambiguous price.`,
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
      // prices. Fail closed instead of sealing one at random. requestHtml() has
      // already used the configured Bright Data fallback when direct HTML was
      // blocked or contained no extractable commerce signal.
      if (ranked.ambiguous) throw ambiguousError(ranked);

      const version = collectorVersion(response);
      let observation = extractPublicPageObservation(response.html, {
        sourceUrl: response.sourceUrl,
        collectorVersion: version,
      });
      observation = restoreFallbackCurrency(observation, this.fallbackCurrency);
      if (ranked.candidate && ranked.candidate.score < MIN_VISIBLE_PRICE_SCORE) {
        const sameAmount = Math.abs(Number(observation.checkout.finalTotal) - ranked.candidate.amount) < 0.000001;
        if (sameAmount && observation.currency === ranked.candidate.currency) throw unsupportedPriceError();
      }
      observation = reconcileVisiblePrice(observation, ranked.candidate, version);
      return observation;
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
