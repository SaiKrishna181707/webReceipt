import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { JsonStore } from './services/store.js';
import { WebReceiptService } from './services/orchestrator.js';
import { SimulatorCollector } from './integrations/simulator.js';
import { BrightDataCollector } from './integrations/brightdata.js';
import { HttpError, readJson, json, html, attachmentHeaders, staticFile } from './http.js';
import { renderHotelFixture } from './fixture-page.js';

const port = Number(process.env.PORT || 3000);
const store = new JsonStore();
await store.load();
const simulator = new SimulatorCollector();
const brightdata = new BrightDataCollector();
const serviceFor = (mode) => new WebReceiptService({ collector: mode === 'brightdata' ? brightdata : simulator, store });
const operatorToken = String(process.env.WEBRECEIPT_OPERATOR_TOKEN || '').trim();
const allowUnprotectedLive = /^(1|true|yes)$/i.test(String(process.env.WEBRECEIPT_ALLOW_UNPROTECTED_LIVE || ''));
const brightdataConfigured = Boolean(brightdata.token && brightdata.collectorId);
let fixtureVersion = 'v1';
let liveOperation = false;

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && timingSafeEqual(left, right);
}

function requireOperator(req, { forLive = false } = {}) {
  if (operatorToken) {
    const supplied = req.headers['x-webreceipt-operator'];
    if (!safeEqual(supplied, operatorToken)) throw new HttpError(401, 'Operator authorization required for this action.', 'operator_required');
    return;
  }
  if (forLive && brightdataConfigured && !allowUnprotectedLive) {
    throw new HttpError(503, 'Bright Data is configured but live mutations are locked. Set WEBRECEIPT_OPERATOR_TOKEN (recommended) or explicitly set WEBRECEIPT_ALLOW_UNPROTECTED_LIVE=true.', 'live_locked');
  }
}

function parseMode(value = 'simulator') {
  if (!['simulator', 'brightdata'].includes(value)) throw new HttpError(400, 'mode must be either "simulator" or "brightdata".', 'invalid_mode');
  if (value === 'brightdata' && !brightdataConfigured) throw new HttpError(503, 'Bright Data live mode is not configured on this deployment.', 'brightdata_not_configured');
  return value;
}

async function withLiveLock(task) {
  if (liveOperation) throw new HttpError(409, 'Another Bright Data operation is already running. Wait for it to finish before starting another.', 'live_operation_busy');
  liveOperation = true;
  try { return await task(); }
  finally { liveOperation = false; }
}

function classifyError(error) {
  if (error instanceof HttpError) return { status: error.status, code: error.code, message: error.message };
  const message = String(error?.message || 'Unexpected error');
  if (/valid URL|Only http|Credential-bearing|publicly reachable|login\/private|public anonymous|Target hostname|Target must/i.test(message)) return { status: 400, code: 'invalid_target', message };
  if (/Need at least two stored observations/i.test(message)) return { status: 409, code: 'insufficient_history', message };
  if (/simulator-only|available only in simulator|Simulator mode only produces data/i.test(message)) return { status: 400, code: 'unsupported_mode', message };
  if (/Unknown simulator mutation|Chaos Checkout mutations/i.test(message)) return { status: 400, code: 'invalid_mutation', message };
  if (/Bright Data mode requires/i.test(message)) return { status: 503, code: 'brightdata_not_configured', message };
  if (/Bright Data .*timed out/i.test(message)) return { status: 504, code: 'brightdata_timeout', message };
  if (/^Bright Data /i.test(message)) return { status: 502, code: 'brightdata_upstream', message };
  console.error(error);
  return { status: 500, code: 'internal_error', message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : message };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/fixture/hotel') {
      return html(res, 200, renderHotelFixture(fixtureVersion), { fixture: true });
    }
    if (req.method === 'GET' && url.pathname === '/api/fixture') return json(res, 200, { version: fixtureVersion });
    if (req.method === 'POST' && url.pathname === '/api/fixture/break') {
      if (brightdataConfigured) requireOperator(req, { forLive: true });
      fixtureVersion = 'v2';
      return json(res, 200, { version: fixtureVersion });
    }
    if (req.method === 'POST' && url.pathname === '/api/fixture/reset') {
      if (brightdataConfigured) requireOperator(req, { forLive: true });
      fixtureVersion = 'v1';
      return json(res, 200, { version: fixtureVersion });
    }
    if (req.method === 'GET' && url.pathname === '/api/health') {
      const liveEnabled = brightdataConfigured && (Boolean(operatorToken) || allowUnprotectedLive);
      return json(res, 200, {
        ok: true,
        name: 'WebReceipt',
        mode: brightdataConfigured ? 'brightdata-ready' : 'simulator',
        fixtureVersion,
        liveOperation,
        liveAccess: {
          configured: brightdataConfigured,
          enabled: liveEnabled,
          protected: Boolean(operatorToken),
        },
        now: new Date().toISOString(),
      });
    }
    if (req.method === 'GET' && url.pathname === '/api/state') return json(res, 200, store.state);

    if (req.method === 'POST' && url.pathname === '/api/observe') {
      const body = await readJson(req);
      const mode = parseMode(body.mode);
      if (mode === 'brightdata') {
        requireOperator(req, { forLive: true });
        const result = await withLiveLock(() => serviceFor(mode).observe({ ...body, mode: undefined }));
        return json(res, 200, result);
      }
      return json(res, 200, await serviceFor(mode).observe({ ...body, mode: undefined }));
    }

    if (req.method === 'POST' && url.pathname === '/api/diff') {
      const body = await readJson(req);
      const mode = parseMode(body.mode);
      const service = serviceFor(mode);
      const result = body.simulate === false
        ? await service.historyDiff({ targetUrl: body.targetUrl })
        : await service.simulatePromiseDiff();
      return json(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/stress') {
      const body = await readJson(req);
      if (body.mode && body.mode !== 'simulator') throw new HttpError(400, 'Chaos Checkout is simulator-only. Use Break website for the live Bright Data fixture.', 'live_stress_blocked');
      return json(res, 200, await serviceFor('simulator').stress(body));
    }

    if (req.method === 'POST' && url.pathname === '/api/reset') {
      if (brightdataConfigured) requireOperator(req, { forLive: true });
      simulator.reset();
      fixtureVersion = 'v1';
      return json(res, 200, await store.reset());
    }

    if (req.method === 'GET' && url.pathname === '/api/export/latest') {
      const latest = store.state.contracts[0];
      if (!latest) return json(res, 404, { error: 'No receipt yet.', code: 'no_receipt' });
      res.writeHead(200, attachmentHeaders(`webreceipt-${latest.contract.dealId}.json`));
      return res.end(JSON.stringify(latest, null, 2));
    }

    if (['GET', 'HEAD'].includes(req.method) && await staticFile(res, url.pathname, { head: req.method === 'HEAD' })) return;
    return json(res, 404, { error: 'Not found', code: 'not_found' });
  } catch (error) {
    const mapped = classifyError(error);
    return json(res, mapped.status, { error: mapped.message, code: mapped.code });
  }
});

server.listen(port, '0.0.0.0', () => console.log(`WebReceipt running at http://localhost:${port}`));
