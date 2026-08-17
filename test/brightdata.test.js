import test from 'node:test';
import assert from 'node:assert/strict';
import { BrightDataCollector } from '../src/integrations/brightdata.js';

test('Bright Data adapter fails closed when credentials are absent', async () => {
  const client = new BrightDataCollector({ token: '', collectorId: '' });
  await assert.rejects(() => client.collect({ url: 'https://example.com' }), /requires BRIGHT_DATA_API_TOKEN/);
  await assert.rejects(() => client.heal({ prompt: 'fix' }), /requires BRIGHT_DATA_API_TOKEN/);
});
