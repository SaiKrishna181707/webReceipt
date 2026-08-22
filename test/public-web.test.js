import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePublicDealHtml } from '../src/integrations/public-web.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';

test('public web parser compiles JSON-LD product data into a valid Deal Contract', () => {
  const html = `<!doctype html>
    <html><head>
      <title>Fallback title</title>
      <meta name="description" content="Breakfast included">
      <script type="application/ld+json">
        {"@type":"Product","name":"Ocean Stay","offers":{"@type":"Offer","price":"1299.00","priceCurrency":"INR"}}
      </script>
    </head><body>
      <h1>Ocean Stay</h1>
      <div>Deal price ₹1,299</div>
      <p>Free cancellation within 24 hours.</p>
      <p>Refundable before arrival.</p>
      <p>Pay now securely.</p>
    </body></html>`;

  const observation = parsePublicDealHtml(html, {
    url: 'https://example.com/deal',
    observedAt: '2026-08-22T10:00:00.000Z',
  });
  const contract = compileDealContract(observation);
  const integrity = evaluateIntegrity(contract);

  assert.equal(contract.subject, 'Ocean Stay');
  assert.equal(contract.offer.advertisedPrice.amount, 1299);
  assert.equal(contract.offer.advertisedPrice.currency, 'INR');
  assert.equal(contract.journey.length, 2);
  assert.equal(contract.evidence.length, 4);
  assert.equal(integrity.status, 'valid');
});

test('public web parser falls back to visible prices and explicit absence terms', () => {
  const html = `<!doctype html><html><head><title>Simple Widget</title></head>
    <body><main><h1>Simple Widget</h1><p>Sale price $49.99</p></main></body></html>`;

  const observation = parsePublicDealHtml(html, {
    url: 'https://shop.example/widget',
    observedAt: '2026-08-22T10:00:00.000Z',
  });
  const contract = compileDealContract(observation);
  const integrity = evaluateIntegrity(contract);

  assert.equal(contract.offer.advertisedPrice.amount, 49.99);
  assert.equal(contract.offer.advertisedPrice.currency, 'USD');
  assert.match(contract.terms.cancellation, /Not stated/);
  assert.equal(integrity.status, 'valid');
});

test('public web parser refuses to invent a deal when a page has no public price', () => {
  assert.throws(
    () => parsePublicDealHtml('<html><head><title>News</title></head><body><p>No commerce here.</p></body></html>', {
      url: 'https://example.com/news',
    }),
    /No public price was found/,
  );
});
