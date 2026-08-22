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

async function malformedJson(path, headers = {}) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: '{broken',
  });
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
// `fileURLToPath`, not `new URL(…).pathname`: on Windows the latter yields
// "/D:/…" with a leading slash, which spawn resolves to "D:\D:\…" and fails.
// CI is ubuntu-latest so it never saw this; a Windows checkout could not run
// the smoke test at all.
const nextBin = fileURLToPath(await import.meta.resolve('next/dist/bin/next'));
const logs = [];
const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port), '-H', '127.0.0.1'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    // Dummy values exercise the configured/protected bridge without allowing a
    // real upstream call. Every protected test below fails before getBrightDataService.
    BRIGHT_DATA_API_TOKEN: 'ci-dummy-bright-data-token',
    BRIGHT_DATA_COLLECTOR_ID: '',
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
  assert(body.liveAccess?.protected === true, 'protected live access should report operator protection');

  response = await fetch(`${base}/fixture/hotel`);
  await assertStatus(response, 200, 'fixture');
  const fixture = await response.text();
  assert(fixture.includes('Review final amount'), 'production fixture is missing V3 interaction drift');

  response = await fetch(`${base}/api/observe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ targetUrl: 'https://demo.webreceipt.dev/hotel/ocean-house', mutation: 'healthy' }),
  });
  await assertStatus(response, 200, 'simulator observe');
  body = await response.json();
  assert(body.integrity?.status === 'valid', `simulator integrity ${body.integrity?.status}`);

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

  // Protected live routes authorize before parsing. No operator header means a
  // stable 401 and must not reach Bright Data even with a syntactically valid body.
  for (const path of ['/api/brightdata/observe', '/api/brightdata/heal']) {
    response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    await assertJsonError(response, 401, 'operator_required', `${path} unauthorized`);

    // With the correct operator header, malformed JSON is rejected before the
    // service/upstream collector is instantiated, so this remains network-free.
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
