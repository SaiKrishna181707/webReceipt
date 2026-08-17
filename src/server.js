import http from 'node:http';
import { JsonStore } from './services/store.js';
import { WebReceiptService } from './services/orchestrator.js';
import { SimulatorCollector } from './integrations/simulator.js';
import { BrightDataCollector } from './integrations/brightdata.js';
import { readJson, json, staticFile } from './http.js';
import { renderHotelFixture } from './fixture-page.js';

const port = Number(process.env.PORT || 3000);
const store = new JsonStore();
await store.load();
const simulator = new SimulatorCollector();
const brightdata = new BrightDataCollector();
const serviceFor = (mode = 'simulator') => new WebReceiptService({ collector: mode === 'brightdata' ? brightdata : simulator, store });
let fixtureVersion = 'v1';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/fixture/hotel') { res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'}); return res.end(renderHotelFixture(fixtureVersion)); }
    if (req.method === 'GET' && url.pathname === '/api/fixture') return json(res, 200, { version: fixtureVersion });
    if (req.method === 'POST' && url.pathname === '/api/fixture/break') { fixtureVersion = 'v2'; return json(res, 200, { version: fixtureVersion }); }
    if (req.method === 'POST' && url.pathname === '/api/fixture/reset') { fixtureVersion = 'v1'; return json(res, 200, { version: fixtureVersion }); }
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, name: 'WebReceipt', mode: process.env.BRIGHT_DATA_API_TOKEN ? 'brightdata-ready' : 'simulator', fixtureVersion, now: new Date().toISOString() });
    if (req.method === 'GET' && url.pathname === '/api/state') return json(res, 200, store.state);
    if (req.method === 'POST' && url.pathname === '/api/observe') {
      const body = await readJson(req); return json(res, 200, await serviceFor(body.mode).observe(body));
    }
    if (req.method === 'POST' && url.pathname === '/api/diff') {
      const body = await readJson(req); return json(res, 200, await serviceFor(body.mode).promiseDiff());
    }
    if (req.method === 'POST' && url.pathname === '/api/stress') {
      const body = await readJson(req); return json(res, 200, await serviceFor(body.mode).stress(body));
    }
    if (req.method === 'POST' && url.pathname === '/api/reset') {
      simulator.reset(); fixtureVersion = 'v1'; return json(res, 200, await store.reset());
    }
    if (req.method === 'GET' && url.pathname === '/api/export/latest') {
      const latest = store.state.contracts[0];
      if (!latest) return json(res, 404, { error: 'No receipt yet.' });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="webreceipt-${latest.contract.dealId}.json"` });
      return res.end(JSON.stringify(latest, null, 2));
    }
    if (req.method === 'GET' && await staticFile(res, url.pathname)) return;
    json(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error(error);
    const clientError = /valid URL|Only http|Credential-bearing|publicly reachable|login\/private|public anonymous/i.test(error.message);
    json(res, clientError ? 400 : 500, { error: error.message });
  }
});

server.listen(port, () => console.log(`WebReceipt running at http://localhost:${port}`));
