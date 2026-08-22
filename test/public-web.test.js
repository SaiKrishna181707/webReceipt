import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPublicPageObservation, PublicWebCollector } from '../src/integrations/public-web.js';
import { assertPublicNetworkTarget, assertPublicTarget } from '../src/domain/target-policy.js';
import { securePublicFetch } from '../src/integrations/pinned-public-fetch.js';
import { compileDealContract } from '../src/domain/contract.js';
import { evaluateIntegrity } from '../src/domain/integrity.js';

const HTML = `<!doctype html><html><head><title>Example Widget</title>
<meta property="product:price:amount" content="1299.50"><meta property="product:price:currency" content="INR">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Example Widget","offers":{"@type":"Offer","price":"1299.50","priceCurrency":"INR"}}</script>
</head><body><h1>Example Widget</h1><p>Free returns within 30 days.</p><p>Pay now by card.</p></body></html>`;

test('public page extraction compiles into a valid Deal Contract', () => {
  const observation = extractPublicPageObservation(HTML, { sourceUrl: 'https://shop.example/item' });
  const contract = compileDealContract(observation);
  const integrity = evaluateIntegrity(contract);
  assert.equal(observation.subject, 'Example Widget');
  assert.equal(observation.currency, 'INR');
  assert.equal(contract.checkout.finalTotal.amount, 1299.5);
  assert.equal(contract.evidence.length, 4);
  assert.equal(contract.journey.length, 2);
  assert.equal(integrity.status, 'valid');
  assert.equal(integrity.passed, integrity.total);
});

test('public page extraction falls back to visible currency text', () => {
  const html = '<html><head><title>Ocean Room</title></head><body><h1>Ocean Room</h1><p>Final price ₹10,147 today.</p><p>Free cancellation until Friday.</p></body></html>';
  const observation = extractPublicPageObservation(html, { sourceUrl: 'https://hotel.example/room' });
  const contract = compileDealContract(observation);
  assert.equal(observation.currency, 'INR');
  assert.equal(contract.checkout.finalTotal.amount, 10147);
  assert.match(contract.terms.cancellation, /cancellation/i);
  assert.equal(evaluateIntegrity(contract).status, 'valid');
});

test('public collector supports deterministic break, verified preview and heal', async () => {
  const fetchImpl = async () => new Response(HTML, { status: 200, headers: { 'content-type': 'text/html' } });
  const collector = new PublicWebCollector({ fetchImpl, resolveTarget: async (url) => url });
  const healthy = await collector.collect({ url: 'https://shop.example/item' });
  const broken = await collector.collect({ url: 'https://shop.example/item', mutation: 'wrong-valid-total' });
  assert.equal(evaluateIntegrity(compileDealContract(healthy)).status, 'valid');
  assert.equal(evaluateIntegrity(compileDealContract(broken)).status, 'invalid');

  const proposal = await collector.heal({ mutation: 'wrong-valid-total', prompt: 'repair' });
  assert.equal(proposal.approval, 'required');
  assert.equal(evaluateIntegrity(compileDealContract(proposal.previewResult[0])).status, 'valid');

  await collector.approveHeal({ mutation: 'wrong-valid-total' });
  const healed = await collector.collect({ url: 'https://shop.example/item', mutation: 'wrong-valid-total' });
  assert.equal(healed.checkout.finalTotal, healthy.checkout.finalTotal);
  assert.equal(evaluateIntegrity(compileDealContract(healed)).status, 'valid');
});

test('public collector safely follows a validated redirect', async () => {
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(url);
    if (requested.length === 1) return new Response('', { status: 302, headers: { location: '/product' } });
    return new Response(HTML, { status: 200, headers: { 'content-type': 'text/html' } });
  };
  const resolved = [];
  const collector = new PublicWebCollector({
    fetchImpl,
    resolveTarget: async (url) => { resolved.push(url); return url; },
  });
  const observation = await collector.collect({ url: 'https://shop.example/start' });
  assert.equal(observation.targetUrl, 'https://shop.example/product');
  assert.equal(resolved.length, 2);
});

test('DNS validation rejects hostnames that resolve to private addresses', async () => {
  await assert.rejects(
    () => assertPublicNetworkTarget('https://example.com/item', {
      lookup: async () => [{ address: '127.0.0.1', family: 4 }],
    }),
    /private\/reserved/,
  );
});

test('public target policy blocks reserved ranges and non-standard ports', () => {
  assert.throws(() => assertPublicTarget('https://example.com:8443/item'), /ports 80 and 443/i);
  assert.throws(() => assertPublicTarget('http://203.0.113.10/item'), /publicly reachable/i);
  assert.throws(() => assertPublicTarget('http://198.51.100.20/item'), /publicly reachable/i);
  assert.throws(() => assertPublicTarget('http://[2001:db8::1]/item'), /publicly reachable/i);
  assert.equal(assertPublicTarget('https://example.com/item#fragment'), 'https://example.com/item');
});

test('DNS-pinned public fetch rejects private targets before opening a socket', async () => {
  await assert.rejects(() => securePublicFetch('http://127.0.0.1/'), /publicly reachable/i);
  await assert.rejects(() => securePublicFetch('http://169.254.169.254/latest/meta-data'), /publicly reachable/i);
});

test('public extraction rejects pages without a priced commerce signal', () => {
  assert.throws(
    () => extractPublicPageObservation('<html><title>No price</title><body>Hello</body></html>', { sourceUrl: 'https://example.com' }),
    /No commerce price/,
  );
});
