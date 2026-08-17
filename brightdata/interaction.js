// WebReceipt custom Scraper Studio Browser Worker interaction.
// Input schema: required `url` pointing to a public anonymous offer/checkout page.
// This intentionally performs a real browser journey so the submission depends on
// Scraper Studio Browser Worker capabilities rather than static HTML fetching.

if (!input || !input.url) {
  bad_input('WebReceipt requires a public URL input.');
  return;
}

navigate(input.url, {wait_until: 'domcontentloaded', timeout: 30000});
wait_visible('[data-testid="offer-panel"]', {timeout: 15000});
wait('[data-testid="advertised-price"]', {timeout: 15000});

// Evidence at the exact promise/offer stage.
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

// Evidence at the final pre-payment checkout stage. No purchase is performed.
tag_screenshot('checkout_screenshot', {
  filename: 'webreceipt-checkout',
  full_page: true,
});

const page = parse();
collect(page, (record) => {
  // Domain-level shape checks only. Semantic correctness is deliberately enforced
  // downstream by WebReceipt's Deal Contract Integrity engine.
  if (!record.offer || record.offer.advertisedPrice == null)
    throw new Error('Missing advertised price');
  if (!record.checkout || record.checkout.basePrice == null)
    throw new Error('Missing checkout base price');
  if (record.checkout.finalTotal == null)
    throw new Error('Missing checkout final total');
  if (!record.terms || !record.terms.cancellation)
    throw new Error('Missing public cancellation terms');
});
