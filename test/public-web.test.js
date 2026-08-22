import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicWebCollector, extractPublicPageObservation } from '../src/integrations/public-web.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';
import { assertPublicTarget } from '../src/domain/target-policy.js';

const TARGET = 'https://shop.example/products/widget';
const JSON_LD_HTML = `<!doctype html>
<html>
<head>
  <title>Travel Widget</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Travel Widget",
    "offers": {
      "@type": "Offer",
      "price": "129.99",
      "priceCurrency": "USD"
    }
  }
  </script>
</head>
<body>
  <h1>Travel Widget</h1>
  <p>Free returns within 30 days.</p>
  <p>Payment is charged when you place the order.</p>
</body>
</html>`;

function integrityOf(observation) {
  return evaluateIntegrity(compileDealContract(observation));
}

test('generic public extractor compiles JSON-LD commerce pages into a valid Deal Contract', () => {
  const observation = extractPublicPageObservation(JSON_LD_HTML, { sourceUrl: TARGET });
  const contract = compileDealContract(observation);
  const integrity = evaluateIntegrity(contract);

  assert.equal(observation.subject, 'Travel Widget');
  assert.equal(contract.offer.advertisedPrice.amount, 129.99);
  assert.equal(contract.offer.advertisedPrice.currency, 'USD');
  assert.match(contract.terms.cancellation, /returns/i);
  assert.equal(integrity.status, 'valid');
  assert.equal(integrity.passed, integrity.total);
});

test('generic public extractor falls back to visible currency text when metadata is absent', () => {
  const html = `<!doctype html><html><head><title>Hotel room</title></head><body>
    <h1>Ocean room</h1><p>Limited deal — final price ₹10,147 today.</p>
    <p>Free cancellation until Friday.</p></body></html>`;
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://hotel.example/room' });

  assert.equal(observation.currency, 'INR');
  assert.equal(observation.checkout.finalTotal, 10147);
  assert.equal(integrityOf(observation).status, 'valid');
});

test('generic public extractor fails clearly instead of inventing a price', () => {
  assert.throws(
    () => extractPublicPageObservation('<html><head><title>Article</title></head><body>No commerce here.</body></html>', { sourceUrl: 'https://news.example/story' }),
    (error) => error?.code === 'scraper_no_price' && error?.status === 422,
  );
});

test('public collector break and verified-heal lifecycle restores semantic integrity', async () => {
  const collector = new PublicWebCollector({
    fetchPage: async (targetUrl) => ({ html: JSON_LD_HTML, sourceUrl: targetUrl, via: 'direct' }),
  });

  const broken = await collector.collect({ url: TARGET, mutation: 'wrong-valid-total' });
  assert.equal(integrityOf(broken).status, 'invalid');
  assert.ok(integrityOf(broken).failures.some((failure) => failure.id === 'total_arithmetic'));

  const proposal = await collector.heal({ mutation: 'wrong-valid-total', prompt: 'repair', targetUrl: TARGET });
  assert.equal(proposal.approval, 'required');
  assert.equal(integrityOf(proposal.previewResult[0]).status, 'valid');

  await collector.approveHeal({ mutation: 'wrong-valid-total', targetUrl: TARGET });
  const repaired = await collector.collect({ url: TARGET, mutation: 'wrong-valid-total' });
  assert.equal(integrityOf(repaired).status, 'valid');
});

test('public target policy blocks non-web ports and reserved addresses', () => {
  assert.throws(() => assertPublicTarget('https://example.com:8443/product'), /ports 80 and 443/i);
  assert.throws(() => assertPublicTarget('http://203.0.113.10/product'), /publicly reachable/i);
  assert.throws(() => assertPublicTarget('http://198.51.100.20/product'), /publicly reachable/i);
  assert.match(assertPublicTarget('https://example.com/product#reviews'), /^https:\/\/example\.com\/product$/);
});
