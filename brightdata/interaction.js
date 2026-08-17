// WebReceipt deterministic fixture scraper — Bright Data Scraper Studio Browser Worker.
// Point `input.url` at the publicly deployed `/fixture/hotel` URL.

navigate(input.url, {wait_until: 'domcontentloaded'});
wait_network_idle({timeout: 800});
tag_screenshot('page_screenshot', {filename: 'webreceipt-checkout', full_page: true});

const page = parse();
collect(page, (record) => {
  if (!record.offer || record.offer.advertisedPrice == null)
    throw new Error('Missing advertised price');
  if (!record.checkout || record.checkout.finalTotal == null)
    throw new Error('Missing final total');
});
