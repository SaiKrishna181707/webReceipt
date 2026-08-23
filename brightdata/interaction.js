// WebReceipt custom Scraper Studio Browser Worker interaction.
// Input schema: required `url` pointing to a PUBLIC, anonymous offer/product page.
//
// Controlled WebReceipt fixture pages keep the original two-stage checkout
// journey used to demonstrate semantic drift. Any other public page stays on the
// product page and is parsed by the generic semantic commerce branch in
// parser.js. No login, personal data entry, or purchase is ever performed.

if (!input || !input.url) {
  bad_input('WebReceipt requires a public URL input.');
  return;
}

const blockedSegments = new Set(['login', 'signin', 'sign-in', 'account', 'my-account', 'private', 'paywall']);
const decodeSegment = (value) => {
  let current = String(value || '');
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch { break; }
  }
  return current.toLowerCase();
};
const hasBlockedPath = (pathname) => String(pathname || '').split('/').filter(Boolean).flatMap((segment) => decodeSegment(segment).split(/[\\/]/).filter(Boolean)).some((segment) => blockedSegments.has(segment));
const isPrivateHost = (hostname) => {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.+$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === '::1' || host === '::' || host.startsWith('::ffff:')) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(host) || /^fe[89ab][0-9a-f]:/i.test(host)) return true;
  const parts = host.split('.').map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    const [a, b] = parts;
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
      || (a === 100 && b >= 64 && b <= 127);
  }
  return false;
};

let target;
try {
  target = new URL(input.url);
} catch {
  bad_input('WebReceipt input.url must be a valid public URL.');
  return;
}

if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
  bad_input('WebReceipt accepts only credential-free HTTP(S) URLs.');
  return;
}
if (isPrivateHost(target.hostname)) {
  bad_input('WebReceipt accepts only publicly reachable hosts, not local/private network targets.');
  return;
}
if (hasBlockedPath(target.pathname)) {
  bad_input('WebReceipt only processes public anonymous pages, not login/private paths.');
  return;
}

navigate(target.toString(), {wait_until: 'domcontentloaded', timeout: 30000});

// Fail closed if a supposedly public URL redirects into an account/login path or
// onto a literal local/private host.
const landed = new URL(location.href);
if (!['http:', 'https:'].includes(landed.protocol) || landed.username || landed.password || isPrivateHost(landed.hostname) || hasBlockedPath(landed.pathname)) {
  dead_page('Target redirected away from a public anonymous journey.');
  return;
}

wait('body', {timeout: 15000});
wait_network_idle({timeout: 1200});
wait_page_idle({idle_timeout: 300});

const controlledFixture = el_exists('[data-testid="offer-panel"]')
  && el_exists('[data-testid="advertised-price"]')
  && el_exists('[data-testid="continue-to-checkout"]');

if (controlledFixture) {
  wait_visible('[data-testid="offer-panel"]', {timeout: 15000});
  wait('[data-testid="advertised-price"]', {timeout: 15000});

  // Capture the promise at the offer stage before navigating the fixture funnel.
  tag_screenshot('offer_screenshot', {
    filename: 'webreceipt-offer',
    full_page: true,
  });

  if (!el_exists('[data-testid="continue-to-checkout"]')) {
    dead_page('Public checkout continuation was not found.');
    return;
  }

  click('[data-testid="continue-to-checkout"]');
  wait_visible('[data-testid="checkout-panel"]', {timeout: 15000});
  wait('[data-testid="base-price"]', {timeout: 15000});
  wait_network_idle({timeout: 800});
  wait_page_idle({idle_timeout: 300});

  // Capture the final pre-payment state. No purchase is performed.
  tag_screenshot('checkout_screenshot', {
    filename: 'webreceipt-checkout',
    full_page: true,
  });

  const page = parse();
  collect(page, (record) => {
    if (!record.subject || !record.targetUrl)
      throw new Error('Missing public offer identity');
    if (!record.offer || record.offer.advertisedPrice == null)
      throw new Error('Missing advertised price');
    if (!record.checkout || record.checkout.basePrice == null)
      throw new Error('Missing checkout base price');
    if (record.checkout.finalTotal == null)
      throw new Error('Missing checkout final total');
    if (!record.terms || !record.terms.cancellation)
      throw new Error('Missing public cancellation terms');
    if (!Array.isArray(record.evidence) || record.evidence.length < 4)
      throw new Error('Missing critical provenance records');
  });
  return;
}

// Generic public product page. Do not click arbitrary third-party controls: that
// could change variants, location, cart state, or enter a checkout flow. Capture
// the stable rendered page and let parser.js rank every plausible money value by
// semantic role instead of selecting the first currency value.
tag_screenshot('offer_screenshot', {
  filename: 'webreceipt-product-page',
  full_page: true,
});

const productPage = parse();
collect(productPage, (record) => {
  if (!record.subject || !record.targetUrl)
    throw new Error('Missing public product identity');
  if (!record.offer || record.offer.advertisedPrice == null)
    throw new Error('Missing semantically credible product price');
  if (!record.currency)
    throw new Error('Missing product price currency');
  if (!Array.isArray(record.evidence) || record.evidence.length < 3)
    throw new Error('Missing product-price provenance records');
});
