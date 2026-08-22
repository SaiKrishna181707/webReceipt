import { spawn } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEMO_URL = 'https://demo.webreceipt.dev/hotel/ocean-house';
const MUTATION = 'wrong-valid-total';
const ROUTES = ['/', '/console', '/receipts', '/mutation-lab', '/docs'];

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
  const deadline = Date.now() + 25_000;
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

async function readJson(response, label) {
  const body = await response.json().catch(async () => ({ raw: await response.text().catch(() => '') }));
  if (!response.ok) throw new Error(`${label} returned ${response.status}: ${JSON.stringify(body).slice(0, 1200)}`);
  return body;
}

async function postJson(base, route, body = {}) {
  return fetch(`${base}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function fullConsoleCycle(base, iteration) {
  let response = await postJson(base, '/api/reset');
  await readJson(response, `cycle ${iteration} reset`);

  response = await postJson(base, '/api/observe', { targetUrl: DEMO_URL, mutation: 'healthy', autoHeal: false });
  let body = await readJson(response, `cycle ${iteration} observe`);
  assert(body.integrity?.status === 'valid', `cycle ${iteration} healthy observe was not valid`);

  response = await postJson(base, '/api/observe', { targetUrl: DEMO_URL, mutation: MUTATION, autoHeal: false });
  body = await readJson(response, `cycle ${iteration} break`);
  assert(body.integrity?.status === 'invalid', `cycle ${iteration} break did not fail integrity`);

  response = await postJson(base, '/api/heal', { targetUrl: DEMO_URL, mutation: MUTATION });
  body = await readJson(response, `cycle ${iteration} heal`);
  assert(body.integrity?.status === 'valid', `cycle ${iteration} heal did not restore validity`);
  assert(body.healed === true, `cycle ${iteration} heal was not verified`);

  response = await postJson(base, '/api/diff', { simulate: true, targetUrl: DEMO_URL });
  body = await readJson(response, `cycle ${iteration} diff`);
  assert(Array.isArray(body.changes), `cycle ${iteration} diff did not return changes`);
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const nextBin = fileURLToPath(await import.meta.resolve('next/dist/bin/next'));
const logs = [];
const stateFile = path.join(os.tmpdir(), `webreceipt-stress-${process.pid}-${Date.now()}.json`);
const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port), '-H', '127.0.0.1'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    WEBRECEIPT_STATE_FILE: stateFile,
    PUBLIC_WEB_REQUESTS_PER_MINUTE: '500',
    PUBLIC_WEB_MAX_CONCURRENT: '16',
    WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE: 'false',
    WEBRECEIPT_ALLOW_UNPROTECTED_LIVE: 'false',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
child.stderr.on('data', (chunk) => logs.push(chunk.toString()));

try {
  await waitFor(`${base}/api/brightdata/health`, child, logs);

  // 1) Hammer every user-facing route concurrently. This catches production
  // rendering failures, static chunk issues and accidental server-only imports.
  const routeRequests = [];
  for (let round = 0; round < 20; round++) {
    for (const route of ROUTES) routeRequests.push(fetch(`${base}${route}`));
  }
  const routeResponses = await Promise.all(routeRequests);
  for (let i = 0; i < routeResponses.length; i++) {
    const response = routeResponses[i];
    assert(response.status === 200, `route hammer request ${i} returned ${response.status}`);
    const html = await response.text();
    assert(/<!DOCTYPE html|<html/i.test(html), `route hammer request ${i} did not return HTML`);
  }

  // 2) Concurrent healthy observations exercise the same endpoint used by the
  // Console while the JSON store is under write pressure.
  const observations = await Promise.all(Array.from({ length: 32 }, (_, index) =>
    postJson(base, '/api/observe', { targetUrl: DEMO_URL, mutation: 'healthy', autoHeal: false })
      .then((response) => readJson(response, `parallel observe ${index}`)),
  ));
  assert(observations.every((item) => item.integrity?.status === 'valid'), 'parallel healthy observations produced an invalid contract');

  // 3) Repeat the exact button workflow enough times to catch stale healed state,
  // reset bugs and store serialization races that a one-shot smoke test misses.
  for (let iteration = 1; iteration <= 8; iteration++) await fullConsoleCycle(base, iteration);

  // 4) Exercise the Mutation Lab API through the built production server.
  let response = await postJson(base, '/api/stress');
  let body = await readJson(response, 'mutation lab stress');
  assert(Number(body.total) > 0, 'mutation lab returned no mutation cases');
  assert(Array.isArray(body.results) && body.results.length === body.total, 'mutation lab result count mismatch');

  // 5) Diff and observe concurrently after a known healthy observation. The
  // shared server store must remain usable under mixed read/write workloads.
  response = await postJson(base, '/api/observe', { targetUrl: DEMO_URL, mutation: 'healthy', autoHeal: false });
  await readJson(response, 'pre-mixed-load observe');
  const mixed = await Promise.all(Array.from({ length: 24 }, (_, index) => {
    if (index % 2 === 0) {
      return postJson(base, '/api/observe', { targetUrl: DEMO_URL, mutation: 'healthy', autoHeal: false })
        .then((r) => readJson(r, `mixed observe ${index}`));
    }
    return postJson(base, '/api/diff', { simulate: true, targetUrl: DEMO_URL })
      .then((r) => readJson(r, `mixed diff ${index}`));
  }));
  assert(mixed.length === 24, 'mixed load did not complete every request');

  // 6) Hostile/invalid pasted URLs must fail closed with a stable 400 instead of
  // causing DNS access, internal network access or a generic 500.
  const invalidTargets = [
    'ftp://example.com/file',
    'http://127.0.0.1:3000/fixture/hotel',
    'http://169.254.169.254/latest/meta-data',
    'http://203.0.113.10/product',
    'https://[::1]/product',
    'https://[2001:db8::1]/product',
    'https://user:pass@example.com/product',
    'https://example.com:8443/product',
    'https://example.com/account/orders',
    'https://example.com/%2561ccount/orders',
  ];
  const invalidResponses = await Promise.all(invalidTargets.map((targetUrl) =>
    postJson(base, '/api/observe', { targetUrl, mutation: 'healthy', autoHeal: false }),
  ));
  for (let i = 0; i < invalidResponses.length; i++) {
    const invalid = invalidResponses[i];
    const invalidBody = await invalid.json().catch(() => ({}));
    assert(invalid.status === 400, `invalid target ${invalidTargets[i]} returned ${invalid.status}`);
    assert(invalidBody.code === 'invalid_target', `invalid target ${invalidTargets[i]} returned code ${invalidBody.code}`);
  }

  // 7) Public state must remain browser-isolated even after heavy server activity.
  response = await fetch(`${base}/api/state`, { cache: 'no-store' });
  body = await readJson(response, 'public state isolation');
  assert(Array.isArray(body.contracts) && body.contracts.length === 0, 'public state leaked server contracts');
  assert(Array.isArray(body.events) && body.events.length === 0, 'public state leaked server events');

  // 8) Final reset + fresh observe proves the app is still usable after all stress.
  response = await postJson(base, '/api/reset');
  await readJson(response, 'final reset');
  response = await postJson(base, '/api/observe', { targetUrl: DEMO_URL, mutation: 'healthy', autoHeal: false });
  body = await readJson(response, 'post-stress observe');
  assert(body.integrity?.status === 'valid', 'post-stress observe was not valid');

  console.log(`Next localhost stress: PASS (${routeResponses.length + observations.length + mixed.length + invalidResponses.length + 8 * 5 + 5} checked operations)`);
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
