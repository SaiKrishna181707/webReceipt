const CURRENCIES = new Map([
  ['₹', 'INR'], ['RS', 'INR'], ['RS.', 'INR'], ['INR', 'INR'],
  ['$', 'USD'], ['US$', 'USD'], ['USD', 'USD'],
  ['€', 'EUR'], ['EUR', 'EUR'], ['£', 'GBP'], ['GBP', 'GBP'], ['¥', 'JPY'], ['JPY', 'JPY'],
  ['A$', 'AUD'], ['AU$', 'AUD'], ['AUD', 'AUD'], ['C$', 'CAD'], ['CA$', 'CAD'], ['CAD', 'CAD'],
  ['S$', 'SGD'], ['SG$', 'SGD'], ['SGD', 'SGD'], ['AED', 'AED'],
  ['R$', 'BRL'], ['BRL', 'BRL'], ['KRW', 'KRW'], ['₩', 'KRW'],
]);

const CURRENCY_PATTERN = '(?:INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD|BRL|KRW|US\\$|AU?\\$|CA?\\$|SG?\\$|Rs\\.?|₹|\\$|€|£|¥|R\\$|₩)';
const AMOUNT_PATTERN = '(?:[0-9]{1,3}(?:[ ,.]?[0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?)';

function decode(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;|\u00a0/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
}

export function visibleCommerceText(html) {
  return decode(String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAmount(value) {
  const raw = String(value || '').replace(/[^0-9.,-]/g, '').trim();
  if (!raw) return null;
  let normalized = raw;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) normalized = raw.replace(/,/g, '');
  else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) normalized = raw.replace(/\./g, '').replace(',', '.');
  else if (raw.includes(',') && !raw.includes('.')) {
    const tail = raw.split(',').at(-1) || '';
    normalized = tail.length === 3 ? raw.replace(/,/g, '') : raw.replace(',', '.');
  } else normalized = raw.replace(/,/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function normalizeCurrency(value) {
  const raw = String(value || '').trim();
  return CURRENCIES.get(raw.toUpperCase()) || CURRENCIES.get(raw) || null;
}

function scoreContext(text, start, end) {
  const contextStart = Math.max(0, start - 90);
  const contextEnd = Math.min(text.length, end + 90);
  const context = text.slice(contextStart, contextEnd).toLowerCase();
  const before = text.slice(Math.max(0, start - 56), start).toLowerCase();
  const after = text.slice(end, Math.min(text.length, end + 40)).toLowerCase();
  let score = 0;

  if (/selling\s+price\s*[:=–—-]?\s*$/.test(before)) score += 150;
  else if (/(?:sale|current|discounted|deal|our|special|offer|member)\s+price\s*[:=–—-]?\s*$/.test(before)) score += 135;
  else if (/(?:grand|order|final|checkout)\s+total\s*[:=–—-]?\s*$|(?:total\s+due|amount\s+due|payable)\s*[:=–—-]?\s*$/.test(before)) score += 125;
  else if (/\b(?:pay\s+now|now)\s*[:=–—-]?\s*$/.test(before)) score += 110;
  else if (/\bprice\s*[:=–—-]?\s*$/.test(before)) score += 80;
  else if (/\b(?:from|starting\s+at|starts\s+at)\s*[:=–—-]?\s*$/.test(before)) score += 45;
  else if (/\bprice\b/.test(context)) score += 20;

  if (/(?:actual|original|list|regular)\s+price\s*[:=–—-]?\s*$|\bmrp\s*[:=–—-]?\s*$|\bwas\s*[:=–—-]?\s*$/.test(before)) score -= 110;
  if (/\b(?:shipping|delivery|service\s+fee|booking\s+fee|tax(?:es)?)\s*[:=–—-]?\s*$/.test(before)) score -= 100;
  if (/\b(?:per\s+month|monthly|emi|installment|instalment)\b|\/\s*(?:mo|month)\b/.test(before + after)) score -= 80;
  if (/\b(?:under|up\s+to)\s*[:=–—-]?\s*$/.test(before)) score -= 55;
  if (/\b(?:free\s+shipping|free\s+delivery|orders?\s+(?:over|above)|minimum\s+(?:order|spend)|spend\s+(?:over|above))\b/.test(before)) score -= 100;
  if (/\b(?:gift\s+card|store\s+credit|reward|wallet\s+credit)\b/.test(before)) score -= 90;

  // Candidate-specific promotion penalties. A legitimate product price is not
  // punished just because the same page contains a coupon elsewhere.
  if (/\b(?:save|get|extra|coupon|promo|voucher|cashback)\b[^₹$€£¥₩0-9]{0,24}$/.test(before)) score -= 110;
  if (/^\s*(?:off|cashback|back|discount)\b/.test(after)) score -= 140;
  if (/\b(?:coupon|promo|voucher)\b/.test(before.slice(-32))) score -= 70;

  return { score, context: text.slice(contextStart, contextEnd).trim() };
}

function capturePriceText(text, start, matched) {
  const before = text.slice(Math.max(0, start - 64), start);
  const label = before.match(/((?:selling|sale|current|discounted|deal|our|special|offer|member|actual|original|list|regular)\s+price|(?:grand|order|final|checkout)\s+total|total\s+due|amount\s+due|payable|pay\s+now|now|price|mrp)\s*[:=–—-]?\s*$/i)?.[1];
  return `${label ? `${label.trim()} ` : ''}${String(matched || '').trim()}`.trim();
}

function candidateKey(candidate) {
  return `${candidate.index}|${candidate.amount}|${candidate.currency}`;
}

export function visiblePriceCandidates(html, { productDetail = false } = {}) {
  const text = visibleCommerceText(html);
  if (!text) return [];
  const headingRaw = String(html || '').match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
  const heading = decode(headingRaw.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const headingIndex = productDetail && heading ? text.indexOf(heading) : -1;
  const headingEnd = headingIndex >= 0 ? headingIndex + heading.length : -1;
  const patterns = [
    { regex: new RegExp(`(${CURRENCY_PATTERN})\\s*(${AMOUNT_PATTERN})(?![0-9A-Za-z])`, 'gi'), currency: 1, amount: 2 },
    { regex: new RegExp(`(${AMOUNT_PATTERN})\\s*(${CURRENCY_PATTERN})(?![A-Za-z0-9])`, 'gi'), currency: 2, amount: 1 },
  ];
  const byKey = new Map();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.regex)) {
      const amount = parseAmount(match[pattern.amount]);
      const currency = normalizeCurrency(match[pattern.currency]);
      if (amount == null || !currency) continue;
      const index = match.index || 0;
      const scored = scoreContext(text, index, index + match[0].length);
      const candidate = { amount, currency, score: scored.score, index, capturedText: capturePriceText(text, index, match[0]) || scored.context || match[0].trim() };
      const key = candidateKey(candidate);
      const prior = byKey.get(key);
      if (!prior || candidate.score > prior.score) byKey.set(key, candidate);
    }
  }
  const candidates = [...byKey.values()];
  if (productDetail && headingEnd >= 0) {
    const afterHeading = candidates.filter((candidate) => candidate.index >= headingEnd && candidate.score >= 0).sort((a, b) => a.index - b.index);
    for (let rank = 0; rank < afterHeading.length; rank++) {
      if (rank === 0) afterHeading[rank].score += 120;
      else if (rank === 1) afterHeading[rank].score += 20;
    }
  }
  return candidates.sort((a, b) => b.score - a.score || a.index - b.index || b.amount - a.amount);
}

export function selectVisibleCommercePrice(html, options = {}) {
  const candidates = visiblePriceCandidates(html, options);
  if (!candidates.length) return { candidate: null, ambiguous: false, candidates: [] };
  const top = candidates[0];
  const competitive = candidates.filter((candidate) => candidate.score >= Math.max(0, top.score - 8));
  const distinct = [];
  for (const candidate of competitive) {
    if (!distinct.some((item) => item.currency === candidate.currency && Math.abs(item.amount - candidate.amount) < 0.000001)) distinct.push(candidate);
  }
  const ambiguous = top.score >= 0 && distinct.length > 1;
  return { candidate: ambiguous ? null : top, ambiguous, candidates: (distinct.length ? distinct : candidates).slice(0, 6) };
}
