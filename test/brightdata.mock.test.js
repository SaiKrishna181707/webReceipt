import test from 'node:test';
import assert from 'node:assert/strict';
import { BrightDataCollector, firstPreviewRecord } from '../src/integrations/brightdata.js';

function response(body, status = 200, headers = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: {'content-type':'application/json', ...headers},
  });
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
  const client = new BrightDataCollector({ token:'token', collectorId:'c_demo', pollMs:1, collectionTimeoutMs:50, requestTimeoutMs:100 });
  const row = await client.collect({ url:'https://example.com/public' });
  assert.equal(row.subject, 'demo');
  assert.match(calls[0].url, /collector=c_demo/);
  assert.equal(JSON.parse(calls[0].options.body)[0].url, 'https://example.com/public');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token');
});

test('Bright Data heal stops at approval gate by default, then explicit approval autosaves and polls to done', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const calls = [];
  let progressPolls = 0;
  globalThis.fetch = async (url, options = {}) => {
    const u = String(url);
    calls.push({u, options});
    if (u.endsWith('/refactor_template') && options.method === 'POST') return response({ status:'started' });
    if (u.endsWith('/resume_automation_job') && options.method === 'POST') return response({ ok:true });
    if (u.endsWith('/refactor_template/progress')) {
      progressPolls++;
      if (progressPolls === 1) return response({ status:'pending_answer', preview_result:[{subject:'preview'}], diff:{template_b:{steps:[1,2]}} });
      return response({ status:'done', version:'v2' });
    }
    throw new Error(`Unexpected URL ${url}`);
  };
  const client = new BrightDataCollector({ token:'token', collectorId:'c_demo', pollMs:1, healTimeoutMs:100, requestTimeoutMs:100 });
  const proposal = await client.heal({ prompt:'Fix final total by semantic meaning', autoApprove:true, customInput:[{url:'https://should-not-be-sent.example'}] });
  const triggerBody = JSON.parse(calls.find((x) => x.u.endsWith('/refactor_template') && x.options.method === 'POST').options.body);
  assert.deepEqual(triggerBody.custom_input, [], 'self-heal input must mirror the official CLI and remain separate from the target URL');
  assert.equal(proposal.status, 'awaiting_approval');
  assert.equal(proposal.approval, 'required');
  assert.equal(firstPreviewRecord(proposal.previewResult).subject, 'preview');
  assert.equal(calls.some((x) => x.u.endsWith('/resume_automation_job')), false, 'proposal must not auto-approve');

  const completion = await client.approveHeal({ autoSave:true });
  assert.equal(completion.status, 'done');
  assert.equal(completion.approval, 'approved');
  assert.equal(completion.autoSaved, true);
  const resume = calls.find((x) => x.u.endsWith('/resume_automation_job'));
  assert.deepEqual(JSON.parse(resume.options.body), {message:true, auto_save:true});
});

test('Bright Data adapter can reject a proposed heal without saving it', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const calls = [];
  let progressPolls = 0;
  globalThis.fetch = async (url, options = {}) => {
    const u = String(url);
    calls.push({u, options});
    if (u.endsWith('/refactor_template') && options.method === 'POST') return response({status:'started'});
    if (u.endsWith('/resume_automation_job') && options.method === 'POST') return response({ok:true});
    if (u.endsWith('/refactor_template/progress')) {
      progressPolls++;
      if (progressPolls === 1) return response({status:'pending_answer', preview_result:[{bad:true}]});
      return response({status:'done'});
    }
    throw new Error(`Unexpected URL ${url}`);
  };
  const client = new BrightDataCollector({token:'token', collectorId:'c_demo', pollMs:1, healTimeoutMs:100, requestTimeoutMs:100});
  await client.heal({prompt:'fix'});
  const result = await client.rejectHeal();
  assert.equal(result.approval, 'rejected');
  const resume = calls.find((x) => x.u.endsWith('/resume_automation_job'));
  assert.deepEqual(JSON.parse(resume.options.body), {message:false});
});

test('preview normalization handles the official array shape defensively', () => {
  assert.deepEqual(firstPreviewRecord([{id:1}, {id:2}]), {id:1});
  assert.deepEqual(firstPreviewRecord({data:[{id:3}]}), {id:3});
  assert.deepEqual(firstPreviewRecord({id:4}), {id:4});
  assert.equal(firstPreviewRecord([]), null);
  assert.equal(firstPreviewRecord(null), null);
});

test('Bright Data adapter retries transient trigger failures', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let triggerAttempts = 0;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.includes('/dca/trigger?')) {
      triggerAttempts++;
      if (triggerAttempts < 3) return response({error:'temporary'}, 503, {'retry-after':'0'});
      return response({collection_id:'j_retry'});
    }
    if (u.includes('/dca/dataset')) return response([{subject:'ok'}]);
    throw new Error(`Unexpected URL ${url}`);
  };
  const client = new BrightDataCollector({ token:'token', collectorId:'c_demo', pollMs:1, collectionTimeoutMs:2000, requestTimeoutMs:100, retries:3 });
  const row = await client.collect({url:'https://example.com'});
  assert.equal(row.subject, 'ok');
  assert.equal(triggerAttempts, 3);
});

test('Bright Data adapter rejects a finished empty dataset instead of polling forever', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url) => String(url).includes('/dca/trigger?') ? response({ collection_id:'j_empty' }) : response([]);
  const client = new BrightDataCollector({ token:'token', collectorId:'c_demo', pollMs:1, collectionTimeoutMs:50, requestTimeoutMs:100 });
  await assert.rejects(() => client.collect({url:'https://example.com'}), /empty dataset/);
});

test('Bright Data adapter fails closed when credentials are absent', async () => {
  const client = new BrightDataCollector({ token:'', collectorId:'' });
  await assert.rejects(() => client.collect({url:'https://example.com'}), /requires BRIGHT_DATA_API_TOKEN/);
  await assert.rejects(() => client.heal({prompt:'fix'}), /requires BRIGHT_DATA_API_TOKEN/);
});

test('Bright Data adapter retries transient network exceptions before succeeding', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let attempts = 0;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.includes('/dca/trigger?')) {
      attempts++;
      if (attempts === 1) throw new TypeError('temporary socket reset');
      return response({collection_id:'j_network_retry'});
    }
    if (u.includes('/dca/dataset')) return response([{subject:'network-recovered'}]);
    throw new Error(`Unexpected URL ${url}`);
  };
  const client = new BrightDataCollector({token:'token', collectorId:'c_demo', pollMs:1, collectionTimeoutMs:1000, requestTimeoutMs:100, retries:2});
  const row = await client.collect({url:'https://example.com/public'});
  assert.equal(row.subject, 'network-recovered');
  assert.equal(attempts, 2);
});

test('Bright Data self-heal fails closed on terminal AI Flow failure', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options = {}) => {
    const u = String(url);
    if (u.endsWith('/refactor_template') && options.method === 'POST') return response({status:'started'});
    if (u.endsWith('/refactor_template/progress')) return response({status:'failed', error:'repair could not be generated'});
    throw new Error(`Unexpected URL ${url}`);
  };
  const client = new BrightDataCollector({token:'token', collectorId:'c_demo', pollMs:1, healTimeoutMs:100, requestTimeoutMs:100});
  await assert.rejects(() => client.heal({prompt:'fix final total'}), /self-heal proposal failed/);
});
