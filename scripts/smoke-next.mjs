import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const OPERATOR_TOKEN = 'ci-operator-token-not-a-real-secret';
const COLLECTOR_ID = 'c_mt3ha1iv1jgm8eg813';
const DEMO_URL = 'https://demo.webreceipt.dev/hotel/ocean-house';
const PRODUCT_DEMO_URL = 'https://demo.webreceipt.dev/fixture/product';
const MUTATION = 'wrong-valid-total';

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close(() => port ? resolve(port) : reject(new Error('Could not allocate port')));
    });
  });
}

async function waitFor(url, child, logs) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`Next server exited early (${child.exitCode})\n${logs.join('')}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Next server did not become ready\n${logs.join('')}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertStatus(response, expected, label) {
  if (response.status === expected) return;
  const detail = await response.clone().text().catch(() => '');
  throw new Error(`${label} status ${response.status}, expected ${expected}${detail ? `: ${detail}` : ''}`);
}

async function assertJsonError(response, expectedStatus, expectedCode, label) {
  await assertStatus(response, expectedStatus, label);
  const body = await response.json();
  assert(body.code === expectedCode, `${label} code ${body.code}, expected ${expectedCode}`);
}

async function postJson(path, body = {}, headers = {}) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function malformedJson(path, headers = {}) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: '{broken',
  });
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const nextBin = fileURLToPath(await import.meta.resolve('next/dist/bin/next'));
const logs = [];
const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port), '-H', '127.0.0.1'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    BRIGHT_DATA_API_TOKEN: 'ci-dummy-bright-data-token',
    BRIGHT_DATA_COLLECTOR_ID: '',
    BRIGHT_DATA_UNLOCKER_ZONE: '',
    WEBRECEIPT_OPERATOR_TOKEN: OPERATOR_TOKEN,
    WEBRECEIPT_ALLOW_UNPROTECTED_LIVE: 'false',
    WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE: 'false',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
child.stderr.on('data', (chunk) => logs.push(chunk.toString()));

try {
  await waitFor(`${base}/api/brightdata/health`, child, logs);

  let response = await fetch(`${base}/api/brightdata/health`);
  await assertStatus(response, 200, 'health');
  let body = await response.json();
  assert(body.mode === 'brightdata-ready', `expected brightdata-ready, got ${body.mode}`);
  assert(body.collectorId === COLLECTOR_ID, `expected fallback collector ${COLLECTOR_ID}, got ${body.collectorId}`);
  assert(body.browserObserve?.enabled === true, 'browserObserve should be enabled when a token is present');
  assert(body.browserObserve?.directPublicTargets === true, 'direct public targets should always be enabled');
  assert(body.browserObserve?.webUnlockerConfigured === false, 'Web Unlocker should not report configured without a zone');
  assert(body.browserObserve?.arbitraryPublicTargets === false, 'arbitrary public fallback should stay disabled without token + zone + opt-in');
  assert(body.liveAccess?.protected === true, 'protected live access should report operator protection');

  for (const route of ['/', '/console', '/receipts', '/mutation-lab', '/docs']) {
    response = await fetch(`${base}${route}`);
    await assertStatus(response, 200, `page ${route}`);
    const html = await response.text();
    assert(/<!DOCTYPE html|<html/i.test(html), `page ${route} did not render HTML`);
  }

  response = await fetch(`${base}/fixture/hotel`);
  await assertStatus(response, 200, 'hotel fixture');
  const hotelFixture = await response.text();
  assert(hotelFixture.includes('Review final amount'), 'production hotel fixture is missing V3 interaction drift');

  response = await fetch(`${base}/fixture/product?version=v1`);
  await assertStatus(response, 200, 'product fixture V1');
  const productV1 = await response.text();
  assert(productV1.includes('WebReceipt-controlled public product fixture'), 'product fixture is not clearly controlled');
  assert(productV1.includes('₹12,999') && productV1.includes('₹13,499'), 'product V1 prices missing');

  response = await fetch(`${base}/fixture/product?version=v2`);
  await assertStatus(response, 200, 'product fixture V2');
  const productV2 = await response.text();
  assert(productV2.includes('redesigned-product-price'), 'product V2 DOM redesign marker missing');
  assert(productV2.includes('class="total-price">₹12,999'), 'product V2 did not move product price under the legacy total selector');
  assert(productV2.includes('data-testid="order-total"'), 'product V2 true final total missing');

  // Exercise the original hotel Console loop.
  response = await postJson('/api/observe', { targetUrl: DEMO_URL, mutation: 'healthy', autoHeal: false });
  await assertStatus(response, 200, 'console observe');
  body = await response.json();
  assert(body.integrity?.status === 'valid', `console observe integrity ${body.integrity?.status}`);

  response = await postJson('/api/observe', { targetUrl: DEMO_URL, mutation: MUTATION, autoHeal: false });
  await assertStatus(response, 200, 'console break');
  body = await response.json();
  assert(body.integrity?.status === 'invalid', `console break integrity ${body.integrity?.status}`);

  response = await postJson('/api/heal', { targetUrl: DEMO_URL, mutation: MUTATION });
  await assertStatus(response, 200, 'console heal');
  body = await response.json();
  assert(body.integrity?.status === 'valid', `console heal integrity ${body.integrity?.status}`);
  assert(body.healed === true, 'console heal did not report a verified repair');

  response = await postJson('/api/diff', { simulate: true, targetUrl: DEMO_URL });
  await assertStatus(response, 200, 'console promise diff');
  body = await response.json();
  assert(Array.isArray(body.changes), 'console promise diff did not return changes');

  response = await postJson('/api/reset');
  await assertStatus(response, 200, 'console reset');

  // Exercise the literal product-price semantic-drift acceptance loop. The same
  // simulator collector observes all three versions; only website structure and
  // the verified repair change.
  response = await postJson('/api/observe', { targetUrl: PRODUCT_DEMO_URL, mutation: 'healthy', autoHeal: false });
  await assertStatus(response, 200, 'product V1 observe');
  body = await response.json();
  assert(body.integrity?.status === 'valid', `product V1 integrity ${body.integrity?.status}`);
  assert(body.contract?.offer?.advertisedPrice?.amount === 12999, 'product V1 product price mismatch');
  assert(body.contract?.checkout?.finalTotal?.amount === 13499, 'product V1 final total mismatch');
  const productCollectorId = body.contract?.collector?.id;

  response = await postJson('/api/observe', { targetUrl: PRODUCT_DEMO_URL, mutation: MUTATION, autoHeal: false });
  await assertStatus(response, 200, 'product V2 drift');
  body = await response.json();
  assert(body.integrity?.status === 'invalid', `product V2 integrity ${body.integrity?.status}`);
  assert(body.contract?.collector?.id === productCollectorId, 'product V2 changed collector identity');
  assert(body.contract?.checkout?.finalTotal?.amount === 12999, 'product V2 should misinterpret the legitimate product price as final total');
  assert(body.integrity?.failures?.some((item) => item.id === 'total_arithmetic'), 'product V2 missing arithmetic/semantic failure');

  response = await postJson('/api/heal', { targetUrl: PRODUCT_DEMO_URL, mutation: MUTATION });
  await assertStatus(response, 200, 'product repair');
  body = await response.json();
  assert(body.integrity?.status === 'valid', `product repaired integrity ${body.integrity?.status}`);
  assert(body.healed === true, 'product repair did not report verified recovery');
  assert(body.contract?.collector?.id === productCollectorId, 'product repair changed collector identity');
  assert(body.contract?.checkout?.finalTotal?.amount === 13499, 'product repair did not restore final total semantics');
  assert(body.repair?.previewIntegrity?.status === 'valid', 'product repair preview was not independently verified');
  assert(body.repair?.postApprovalVerified === true, 'product repair fresh rerun was not independently verified');

  response = await postJson('/api/diff', { simulate: false, targetUrl: PRODUCT_DEMO_URL });
  await assertStatus(response, 200, 'product stored-history diff');
  body = await response.json();
  assert(body.source === 'stored-history', `product diff source ${body.source}`);
  const finalTotalChange = body.changes?.find((change) => change.path === 'checkout.finalTotal');
  assert(finalTotalChange?.before === 12999 && finalTotalChange?.after === 13499, 'product diff did not compare actual adjacent contract versions');

  response = await postJson('/api/reset');
  await assertStatus(response, 200, 'final reset');
  body = await response.json();
  assert(Array.isArray(body.contracts) && body.contracts.length === 0, 'final reset did not clear contracts');
  assert(Array.isArray(body.events) && body.events.length === 0, 'final reset did not clear events');

  for (const path of ['/api/observe', '/api/heal', '/api/diff', '/api/stress']) {
    response = await malformedJson(path);
    await assertJsonError(response, 400, 'invalid_json', `${path} malformed JSON`);
  }

  response = await fetch(`${base}/api/observe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pad: 'x'.repeat(300_000) }),
  });
  await assertJsonError(response, 413, 'body_too_large', 'oversized public body');

  response = await fetch(`${base}/api/observe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d]),
  });
  await assertJsonError(response, 400, 'invalid_json', 'invalid UTF-8 public body');

  for (const path of ['/api/brightdata/observe', '/api/brightdata/heal']) {
    response = await postJson(path);
    await assertJsonError(response, 401, 'operator_required', `${path} unauthorized`);

    response = await malformedJson(path, { 'x-webreceipt-operator': OPERATOR_TOKEN });
    await assertJsonError(response, 400, 'invalid_json', `${path} malformed authorized JSON`);
  }

  console.log('Next production smoke: PASS');
} finally {
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    if (child.exitCode != null) return resolve();
    child.once('exit', resolve);
    setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 3000).unref();
  });
}
