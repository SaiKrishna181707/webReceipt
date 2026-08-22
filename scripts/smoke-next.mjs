import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const OPERATOR_TOKEN = 'ci-operator-token-not-a-real-secret';
const COLLECTOR_ID = 'c_mt3ha1iv1jgm8eg813';

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
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Next server did not become ready\n${logs.join('')}`);
}

function assert(condition, message) { if (!condition) throw new Error(message); }
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
async function malformedJson(path, headers = {}) {
  return fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: '{broken' });
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const nextBin = fileURLToPath(await import.meta.resolve('next/dist/bin/next'));
const logs = [];
const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port), '-H', '127.0.0.1'], {
  env: { ...process.env, NODE_ENV: 'production', BRIGHT_DATA_API_TOKEN: 'ci-dummy-bright-data-token', BRIGHT_DATA_COLLECTOR_ID: '', WEBRECEIPT_OPERATOR_TOKEN: OPERATOR_TOKEN, WEBRECEIPT_ALLOW_UNPROTECTED_LIVE: 'false', WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE: 'false' },
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
  assert(body.liveAccess?.protected === true, 'protected live access should report operator protection');

  response = await fetch(`${base}/fixture/hotel`);
  await assertStatus(response, 200, 'fixture');
  const fixture = await response.text();
  assert(fixture.includes('Review final amount'), 'production fixture is missing V3 interaction drift');

  response = await fetch(`${base}/api/observe`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targetUrl: 'https://demo.webreceipt.dev/hotel/ocean-house', mutation: 'healthy' }) });
  await assertStatus(response, 200, 'simulator observe');
  body = await response.json();
  assert(body.integrity?.status === 'valid', `simulator integrity ${body.integrity?.status}`);
  const firstObservation = body;

  response = await fetch(`${base}/api/state`, { cache: 'no-store' });
  await assertStatus(response, 200, 'public state');
  body = await response.json();
  assert(Array.isArray(body.contracts) && body.contracts.length === 0, 'public state leaked server contracts');
  assert(Array.isArray(body.events) && body.events.length === 0, 'public state leaked server events');

  response = await fetch(`${base}/api/observe`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targetUrl: 'https://demo.webreceipt.dev/hotel/ocean-house', mutation: 'healthy' }) });
  await assertStatus(response, 200, 'second simulator observe');
  const secondObservation = await response.json();

  response = await fetch(`${base}/api/diff`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ before: firstObservation.contract, after: secondObservation.contract }) });
  await assertStatus(response, 200, 'sealed client-history diff');
  body = await response.json();
  assert(body.source === 'client-history', `expected client-history diff, got ${body.source}`);

  const tampered = JSON.parse(JSON.stringify(secondObservation.contract));
  tampered.checkout.finalTotal.amount += 1;
  response = await fetch(`${base}/api/diff`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ before: firstObservation.contract, after: tampered }) });
  await assertJsonError(response, 400, 'invalid_diff', 'tampered client-history diff');

  for (const path of ['/api/observe', '/api/heal', '/api/diff', '/api/stress']) {
    response = await malformedJson(path);
    await assertJsonError(response, 400, 'invalid_json', `${path} malformed JSON`);
  }

  response = await fetch(`${base}/api/observe`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pad: 'x'.repeat(300_000) }) });
  await assertJsonError(response, 413, 'body_too_large', 'oversized public body');

  response = await fetch(`${base}/api/observe`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d]) });
  await assertJsonError(response, 400, 'invalid_json', 'invalid UTF-8 public body');

  for (const path of ['/api/brightdata/observe', '/api/brightdata/heal']) {
    response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    await assertJsonError(response, 401, 'operator_required', `${path} unauthorized`);
    response = await malformedJson(path, { 'x-webreceipt-operator': OPERATOR_TOKEN });
    await assertJsonError(response, 400, 'invalid_json', `${path} malformed authorized JSON`);
  }

  for (let i = 0; i < 12; i++) {
    response = await fetch(`${base}/api/observe`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targetUrl: 'http://127.0.0.1/not-a-fixture', mutation: 'healthy' }) });
    await assertJsonError(response, 400, 'invalid_target', `public limiter warmup ${i + 1}`);
  }
  response = await fetch(`${base}/api/observe`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targetUrl: 'http://127.0.0.1/not-a-fixture', mutation: 'healthy' }) });
  await assertJsonError(response, 429, 'rate_limited', 'public rate limit');

  console.log('Next production smoke: PASS');
} finally {
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    if (child.exitCode != null) return resolve();
    child.once('exit', resolve);
    setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 3000).unref();
  });
}
