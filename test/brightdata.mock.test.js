import test from 'node:test';
import assert from 'node:assert/strict';
import { BrightDataCollector } from '../src/integrations/brightdata.js';

function response(body, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: {'content-type':'application/json'} });
}

test('Bright Data adapter triggers, polls and returns first dataset record', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/dca/trigger?')) return response({ collection_id: 'j_demo' });
    if (String(url).includes('/dca/dataset')) return response([{ subject:'demo', checkout:{}, offer:{} }]);
    throw new Error(`Unexpected URL ${url}`);
  };
  const client = new BrightDataCollector({ token:'token', collectorId:'c_demo', pollMs:1, timeoutMs:50 });
  const row = await client.collect({ url:'https://example.com/public' });
  assert.equal(row.subject, 'demo');
  assert.match(calls[0].url, /collector=c_demo/);
  assert.equal(JSON.parse(calls[0].options.body)[0].url, 'https://example.com/public');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token');
});

test('Bright Data adapter polls self-heal until a completed response', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let polls = 0;
  globalThis.fetch = async (url, options = {}) => {
    const u = String(url);
    if (u.endsWith('/refactor_template') && options.method === 'POST') return response({ status:'started' });
    if (u.endsWith('/refactor_template/progress')) {
      polls++;
      return response(polls === 1 ? { status:'running' } : { status:'completed', version:'v2' });
    }
    throw new Error(`Unexpected URL ${url}`);
  };
  const client = new BrightDataCollector({ token:'token', collectorId:'c_demo', pollMs:1, timeoutMs:100 });
  const result = await client.heal({ prompt:'Fix final total by semantic meaning', customInput:[{url:'https://example.com'}] });
  assert.equal(result.status, 'completed');
  assert.equal(polls, 2);
});


test('Bright Data adapter retries transient trigger failures', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let triggerAttempts = 0;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.includes('/dca/trigger?')) {
      triggerAttempts++;
      if (triggerAttempts < 3) return response({error:'temporary'}, 503);
      return response({collection_id:'j_retry'});
    }
    if (u.includes('/dca/dataset')) return response([{subject:'ok'}]);
    throw new Error(`Unexpected URL ${url}`);
  };
  const client = new BrightDataCollector({ token:'token', collectorId:'c_demo', pollMs:1, timeoutMs:2000, retries:3 });
  const row = await client.collect({url:'https://example.com'});
  assert.equal(row.subject, 'ok');
  assert.equal(triggerAttempts, 3);
});

test('Bright Data adapter rejects a finished empty dataset instead of polling forever', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url) => String(url).includes('/dca/trigger?') ? response({ collection_id:'j_empty' }) : response([]);
  const client = new BrightDataCollector({ token:'token', collectorId:'c_demo', pollMs:1, timeoutMs:50 });
  await assert.rejects(() => client.collect({url:'https://example.com'}), /empty dataset/);
});
