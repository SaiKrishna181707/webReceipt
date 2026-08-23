import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

const port = 33000 + Math.floor(Math.random() * 1000);
const stateFile = path.join(os.tmpdir(), `webreceipt-http-${port}.json`);
let proc;

async function waitForServer(targetPort) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${targetPort}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Server did not start');
}

test.before(async () => {
  proc = spawn(process.execPath, ['src/server.js'], {
    env: {
      ...process.env,
      PORT: String(port),
      BRIGHT_DATA_API_TOKEN: '',
      BRIGHT_DATA_COLLECTOR_ID: '',
      WEBRECEIPT_OPERATOR_TOKEN: '',
      WEBRECEIPT_STATE_FILE: stateFile,
    },
    stdio: ['ignore','pipe','pipe'],
  });
  await waitForServer(port);
});

test.after(async () => {
  proc?.kill('SIGTERM');
  await fs.unlink(stateFile).catch(() => {});
});

test('HTTP health, observe, export and stress flows work end-to-end with security headers', async () => {
  let response = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /default-src/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const health = await response.json();
  assert.equal(health.liveAccess.configured, false);

  // `src/server.js` is an API-only Bright Data harness. The legacy static UI in
  // public/ was removed because it hardcoded a non-existent collector ID and an
  // export link that only this server implements. Assert it stays removed.
  response = await fetch(`http://127.0.0.1:${port}/`, {method:'HEAD'});
  assert.equal(response.status, 404);

  response = await fetch(`http://127.0.0.1:${port}/api/reset`, { method: 'POST', headers: {'content-type':'application/json'}, body: '{}' });
  assert.equal(response.status, 200);

  response = await fetch(`http://127.0.0.1:${port}/api/observe`, {
    method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ mutation: 'wrong-valid-total' })
  });
  assert.equal(response.status, 200);
  const observed = await response.json();
  assert.equal(observed.healed, true);
  assert.equal(observed.integrity.status, 'valid');
  assert.equal(observed.repair.previewIntegrity.status, 'valid');
  assert.equal(observed.repair.approved, true);

  response = await fetch(`http://127.0.0.1:${port}/api/export/latest`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /^attachment; filename="webreceipt-[A-Za-z0-9._-]+\.json"$/);
  const exported = await response.json();
  assert.equal(exported.integrity.status, 'valid');

  response = await fetch(`http://127.0.0.1:${port}/api/stress`, { method:'POST', headers:{'content-type':'application/json'}, body:'{}' });
  assert.equal(response.status, 200);
  const stress = await response.json();
  assert.equal(stress.recovered, stress.total);
});

test('controlled fixture changes semantics and restructures the real total while legacy selector remains alive', async () => {
  await fetch(`http://127.0.0.1:${port}/api/fixture/reset`, {method:'POST', headers:{'content-type':'application/json'}, body:'{}'});
  let response = await fetch(`http://127.0.0.1:${port}/fixture/hotel`);
  let html = await response.text();
  assert.match(html, /class="total-price" data-testid="order-total">₹10,147/);

  await fetch(`http://127.0.0.1:${port}/api/fixture/break`, {method:'POST', headers:{'content-type':'application/json'}, body:'{}'});
  response = await fetch(`http://127.0.0.1:${port}/fixture/hotel`);
  html = await response.text();
  assert.match(html, /class="total-price">₹8,499/);
  assert.match(html, /data-testid="order-total"[^>]*>.*currency-symbol.*₹.*major.*10,147/s);
  assert.doesNotMatch(html, /class="total-price"[^>]*>₹10,147/);
});

test('HTTP rejects private targets, invalid modes, malformed JSON, oversized bodies and live chaos requests', async () => {
  let response = await fetch(`http://127.0.0.1:${port}/api/observe`, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ targetUrl:'https://example.com/login' })
  });
  assert.equal(response.status, 400);

  response = await fetch(`http://127.0.0.1:${port}/api/observe`, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ mode:'not-real' })
  });
  assert.equal(response.status, 400);

  response = await fetch(`http://127.0.0.1:${port}/api/observe`, {
    method:'POST', headers:{'content-type':'application/json'}, body:'{broken'
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'invalid_json');

  response = await fetch(`http://127.0.0.1:${port}/api/observe`, {
    method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ pad:'x'.repeat(270_000) })
  });
  assert.equal(response.status, 413);

  response = await fetch(`http://127.0.0.1:${port}/api/stress`, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({mode:'brightdata'})
  });
  assert.equal(response.status, 400);

  response = await fetch(`http://127.0.0.1:${port}/api/observe`, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({mutation:'not-real'})
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'invalid_mutation');

  response = await fetch(`http://127.0.0.1:${port}/api/stress`, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({mutations:Array(21).fill('wrong-valid-total')})
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'invalid_mutation');

  response = await fetch(`http://127.0.0.1:${port}/%2e%2e/package.json`);
  assert.equal(response.status, 404, 'static serving must never escape public/');
});

test('live Promise Diff is honest stored-history comparison rather than synthetic data', async () => {
  await fetch(`http://127.0.0.1:${port}/api/reset`, {method:'POST', headers:{'content-type':'application/json'}, body:'{}'});
  for (let i = 0; i < 2; i++) {
    const response = await fetch(`http://127.0.0.1:${port}/api/observe`, {method:'POST', headers:{'content-type':'application/json'}, body:'{}'});
    assert.equal(response.status, 200);
  }
  const response = await fetch(`http://127.0.0.1:${port}/api/diff`, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({simulate:false})
  });
  assert.equal(response.status, 200);
  const diff = await response.json();
  assert.equal(diff.source, 'stored-history');
  assert.deepEqual(diff.changes, []);
});

test('public deployment with Bright Data credentials locks mutating/live actions behind operator token', async (t) => {
  const protectedPort = port + 1500;
  const protectedStateFile = path.join(os.tmpdir(), `webreceipt-protected-${protectedPort}.json`);
  const child = spawn(process.execPath, ['src/server.js'], {
    env: {
      ...process.env,
      PORT: String(protectedPort),
      BRIGHT_DATA_API_TOKEN: 'fake-token-never-used',
      BRIGHT_DATA_COLLECTOR_ID: 'c_fake',
      WEBRECEIPT_OPERATOR_TOKEN: 'judge-secret',
      WEBRECEIPT_ALLOW_UNPROTECTED_LIVE: 'false',
      WEBRECEIPT_STATE_FILE: protectedStateFile,
    },
    stdio: ['ignore','pipe','pipe'],
  });
  t.after(async () => {
    child.kill('SIGTERM');
    await fs.unlink(protectedStateFile).catch(() => {});
  });
  await waitForServer(protectedPort);

  let response = await fetch(`http://127.0.0.1:${protectedPort}/api/fixture/break`, {method:'POST', body:'{}', headers:{'content-type':'application/json'}});
  assert.equal(response.status, 401);
  response = await fetch(`http://127.0.0.1:${protectedPort}/api/observe`, {method:'POST', body:JSON.stringify({mode:'brightdata'}), headers:{'content-type':'application/json'}});
  assert.equal(response.status, 401, 'must reject before any Bright Data network call');

  response = await fetch(`http://127.0.0.1:${protectedPort}/api/fixture/break`, {
    method:'POST', body:'{}', headers:{'content-type':'application/json','x-webreceipt-operator':'judge-secret'}
  });
  assert.equal(response.status, 200);
});
