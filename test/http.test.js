import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 33000 + Math.floor(Math.random() * 1000);
let proc;

test.before(async () => {
  proc = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore','pipe','pipe'] });
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try { const r = await fetch(`http://127.0.0.1:${port}/api/health`); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('Server did not start');
});

test.after(() => proc?.kill('SIGTERM'));

test('HTTP health, observe, export and stress flows work end-to-end', async () => {
  let r = await fetch(`http://127.0.0.1:${port}/api/reset`, { method: 'POST', headers: {'content-type':'application/json'}, body: '{}' });
  assert.equal(r.status, 200);

  r = await fetch(`http://127.0.0.1:${port}/api/observe`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ mutation: 'wrong-valid-total' }) });
  assert.equal(r.status, 200);
  const observed = await r.json();
  assert.equal(observed.healed, true);
  assert.equal(observed.integrity.status, 'valid');

  r = await fetch(`http://127.0.0.1:${port}/api/export/latest`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-disposition'), /webreceipt-/);
  const exported = await r.json();
  assert.equal(exported.integrity.status, 'valid');

  r = await fetch(`http://127.0.0.1:${port}/api/stress`, { method:'POST', headers:{'content-type':'application/json'}, body:'{}' });
  assert.equal(r.status, 200);
  const stress = await r.json();
  assert.equal(stress.recovered, stress.total);
});


test('controlled fixture changes meaning while keeping the legacy selector alive', async () => {
  await fetch(`http://127.0.0.1:${port}/api/fixture/reset`, {method:'POST', headers:{'content-type':'application/json'}, body:'{}'});
  let r = await fetch(`http://127.0.0.1:${port}/fixture/hotel`);
  let html = await r.text();
  assert.match(html, /class="total-price" data-testid="order-total">₹10,147/);
  await fetch(`http://127.0.0.1:${port}/api/fixture/break`, {method:'POST', headers:{'content-type':'application/json'}, body:'{}'});
  r = await fetch(`http://127.0.0.1:${port}/fixture/hotel`);
  html = await r.text();
  assert.match(html, /class="total-price">₹8,499/);
  assert.match(html, /data-testid="order-total">₹10,147/);
});

test('HTTP layer refuses a private-looking target', async () => {
  const r = await fetch(`http://127.0.0.1:${port}/api/observe`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ targetUrl:'https://example.com/login' }) });
  assert.equal(r.status, 400);
  const body = await r.json();
  assert.match(body.error, /public anonymous|login\/private/i);
});
