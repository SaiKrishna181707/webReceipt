// Shared HTML-to-text and money-pattern primitives for the public-web collector
// layers. Each of these existed as a byte-identical copy in two to four modules;
// a divergent copy is a semantic-extraction bug waiting to happen, which is
// exactly the failure mode this project exists to catch.
//
// Only genuinely identical definitions live here. Notably absent:
//   * the currency *symbol* maps — public-web, public-web-resilient and
//     commerce-price each accept a different symbol vocabulary, so they are
//     three different lookup contracts, not one duplicated table.
//   * commerce-price's own currency pattern — it recognises BRL/KRW and folds
//     A$/AU$ into `AU?\$`, so it is a superset, not a copy.

// Entity decoding is the union of what the previous copies handled: the base
// collector decoded `&lt;`/`&gt;` but left literal U+00A0 alone, the three later
// copies did the reverse. Both rules are strictly normalising and every call
// site strips tags *before* decoding, so a decoded `<` can never re-enter the
// markup as a tag.
export function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;|\u00a0/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)));
}

// Regex *fragments*, interpolated into larger patterns by the callers — not
// compiled RegExp objects, so there is no shared `lastIndex` to leak between
// modules.
export const CURRENCY_PATTERN = '(?:INR|USD|EUR|GBP|JPY|AUD|CAD|AED|SGD|US\\$|A\\$|AU\\$|C\\$|CA\\$|S\\$|SG\\$|Rs\\.?|₹|\\$|€|£|¥)';
export const AMOUNT_PATTERN = '(?:[0-9]{1,3}(?:[ ,.]?[0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?)';

// The ISO codes WebReceipt will accept as a contract currency. Read-only at
// every call site (`.has()` only); never mutate it.
export const SUPPORTED_CURRENCY_CODES = new Set(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'AED', 'SGD']);
