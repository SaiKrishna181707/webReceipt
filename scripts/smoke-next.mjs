import { spawn } from 'node:child_process';
import net from 'node:net';

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

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const nextBin = await import.meta.resolve('next/dist/bin/next');
const logs = [];
const child = spawn(process.execPath, [new URL(nextBin).pathname, 'start', '-p', String(port), '-H', '127.0.0.1'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    BRIGHT_DATA_API_TOKEN: '',
    BRIGHT_DATA_COLLECTOR_ID: '',
    WEBRECEIPT_OPERATOR_TOKEN: '',
    WEBRECEIPT_ALLOW_UNPROTECTED_LIVE: 'false',
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
  assert(body.mode === 'not-configured', `expected not-configured, got ${body.mode}`);

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

  response = await fetch(`${base}/api/observe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{broken',
  });
  await assertStatus(response, 400, 'malformed JSON');
  body = await response.json();
  assert(body.code === 'invalid_json', `malformed JSON code ${body.code}`);

  response = await fetch(`${base}/api/observe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pad: 'x'.repeat(300_000) }),
  });
  await assertStatus(response, 413, 'oversized body');
  body = await response.json();
  assert(body.code === 'body_too_large', `oversized body code ${body.code}`);

  response = await fetch(`${base}/api/brightdata/observe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ targetUrl: 'https://web-receipt-tawny.vercel.app/fixture/hotel' }),
  });
  await assertStatus(response, 503, 'unconfigured live');
  body = await response.json();
  assert(body.code === 'brightdata_not_configured', `unconfigured live code ${body.code}`);

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
