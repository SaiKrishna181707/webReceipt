import test from 'node:test';
import assert from 'node:assert/strict';
import { readWebJson, WebRequestError } from '../src/web-request.js';

function request(body, headers = {}) {
  return new Request('https://webreceipt.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

test('web request parser accepts an empty request as an empty object', async () => {
  const req = new Request('https://webreceipt.test/api', { method: 'POST' });
  assert.deepEqual(await readWebJson(req), {});
});

test('web request parser accepts a normal JSON object', async () => {
  assert.deepEqual(await readWebJson(request('{"targetUrl":"https://example.com"}')), {
    targetUrl: 'https://example.com',
  });
});

test('web request parser rejects malformed JSON instead of silently using defaults', async () => {
  await assert.rejects(
    () => readWebJson(request('{broken')),
    (error) => error instanceof WebRequestError && error.status === 400 && error.code === 'invalid_json',
  );
});

test('web request parser rejects arrays and primitives', async () => {
  for (const body of ['[]', 'null', '42', '"text"']) {
    await assert.rejects(
      () => readWebJson(request(body)),
      (error) => error instanceof WebRequestError && error.status === 400 && error.code === 'invalid_json',
    );
  }
});

test('web request parser rejects a declared oversized body before reading it', async () => {
  const req = request('{}', { 'content-length': '999999' });
  await assert.rejects(
    () => readWebJson(req, { maxBytes: 128 }),
    (error) => error instanceof WebRequestError && error.status === 413 && error.code === 'body_too_large',
  );
});

test('web request parser rejects streamed content that exceeds the limit', async () => {
  await assert.rejects(
    () => readWebJson(request(JSON.stringify({ pad: 'x'.repeat(1024) })), { maxBytes: 64 }),
    (error) => error instanceof WebRequestError && error.status === 413 && error.code === 'body_too_large',
  );
});
