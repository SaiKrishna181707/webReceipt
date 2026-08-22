import {
  PublicWebCollector as ProductionPublicWebCollector,
  enhanceProductionCommerceHtml as enhanceBaseProductionCommerceHtml,
} from './public-web-production.js';

const CURRENCY = '(?:INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD|US\\$|A\\$|AU\\$|C\\$|CA\\$|S\\$|SG\\$|Rs\\.?|₹|\\$|€|£|¥)';
const AMOUNT = '(?:[0-9]{1,3}(?:[ ,.]?[0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?)';
const PRIORITY_LABELS = [
  ['grand total', 50], ['order total', 49], ['final total', 48], ['checkout total', 47],
  ['total due', 46], ['amount due', 45], ['payable', 44], ['sale price', 38],
  ['current price', 37], ['deal price', 36], ['our price', 35], ['special price', 34],
  ['pay now', 33], ['now', 30],
];

function decode(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;|\u00a0/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
}

function visibleText(html) {
  return decode(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findExplicitCurrentPrice(html) {
  const text = visibleText(html);
  if (!text) return null;
  let selected = null;
  for (const [label, score] of PRIORITY_LABELS) {
    const prefix = escapeRegex(label);
    const patterns = [
      new RegExp(`\\b${prefix}\\b\\s*(?:price)?\\s*[:=–—-]?\\s*(${CURRENCY})\\s*(${AMOUNT})`, 'ig'),
      new RegExp(`\\b${prefix}\\b\\s*(?:price)?\\s*[:=–—-]?\\s*(${AMOUNT})\\s*(${CURRENCY})(?![A-Za-z])`, 'ig'),
    ];
    for (let index = 0; index < patterns.length; index++) {
      for (const match of text.matchAll(patterns[index])) {
        const candidate = {
          score,
          index: match.index || 0,
          amount: index === 0 ? match[2] : match[1],
          currency: index === 0 ? match[1] : match[2],
        };
        if (!selected || candidate.score > selected.score || (candidate.score === selected.score && candidate.index > selected.index)) selected = candidate;
      }
    }
  }
  return selected;
}

function injectPriorityPrice(html, candidate) {
  if (!candidate) return String(html || '');
  const amount = String(candidate.amount).replace(/[^0-9.,]/g, '');
  const currency = String(candidate.currency).trim();
  if (!amount || !currency) return String(html || '');
  const injected = `<meta property="product:price:amount" content="${amount.replace(/"/g, '&quot;')}"><meta property="product:price:currency" content="${currency.replace(/"/g, '&quot;')}">`;
  const value = String(html || '');
  return /<head\b[^>]*>/i.test(value)
    ? value.replace(/<head\b[^>]*>/i, (head) => `${head}${injected}`)
    : `${injected}${value}`;
}

export function enhanceProductionCommerceHtml(html, options = {}) {
  const prepared = enhanceBaseProductionCommerceHtml(html, options);
  return injectPriorityPrice(prepared, findExplicitCurrentPrice(html));
}

export class PublicWebCollector extends ProductionPublicWebCollector {
  async requestHtml(rawUrl) {
    const response = await super.requestHtml(rawUrl);
    return {
      ...response,
      html: enhanceProductionCommerceHtml(response.html, { sourceUrl: response.sourceUrl }),
    };
  }
}
