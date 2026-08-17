const API = 'https://api.brightdata.com';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export class BrightDataCollector {
  constructor({ token = process.env.BRIGHT_DATA_API_TOKEN, collectorId = process.env.BRIGHT_DATA_COLLECTOR_ID, pollMs = 5000, timeoutMs = 240000, retries = 3 } = {}) {
    this.kind = 'brightdata';
    this.token = token;
    this.collectorId = collectorId;
    this.pollMs = pollMs;
    this.timeoutMs = timeoutMs;
    this.retries = retries;
  }

  assertConfigured() {
    if (!this.token || !this.collectorId) throw new Error('Bright Data mode requires BRIGHT_DATA_API_TOKEN and BRIGHT_DATA_COLLECTOR_ID.');
  }

  headers() { return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }; }

  async request(url, options = {}) {
    let last;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!RETRYABLE.has(response.status) || attempt === this.retries) return response;
        last = new Error(`Bright Data transient HTTP ${response.status}`);
      } catch (error) {
        last = error;
        if (attempt === this.retries) throw error;
      }
      await sleep(250 * (2 ** attempt));
    }
    throw last ?? new Error('Bright Data request failed.');
  }

  async collect({ url }) {
    this.assertConfigured();
    const trigger = await this.request(`${API}/dca/trigger?collector=${encodeURIComponent(this.collectorId)}&queue_next=1`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify([{ url }])
    });
    if (!trigger.ok) throw new Error(`Bright Data trigger failed: ${trigger.status} ${await trigger.text()}`);
    const triggerBody = await trigger.json();
    const snapshotId = triggerBody.collection_id;
    if (!snapshotId) throw new Error(`Bright Data trigger response did not include collection_id: ${JSON.stringify(triggerBody)}`);

    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      const response = await this.request(`${API}/dca/dataset?id=${encodeURIComponent(snapshotId)}`, { headers: { Authorization: `Bearer ${this.token}` } });
      if ([401, 403, 404, 422].includes(response.status)) throw new Error(`Bright Data dataset fetch failed: ${response.status} ${await response.text()}`);
      if (response.ok) {
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = null; }
        if (Array.isArray(data)) {
          if (!data.length) throw new Error('Bright Data returned an empty dataset.');
          return data[0];
        }
      }
      await sleep(this.pollMs);
    }
    throw new Error(`Bright Data collection timed out after ${this.timeoutMs}ms.`);
  }

  async heal({ prompt, customInput = [] }) {
    this.assertConfigured();
    const response = await this.request(`${API}/dca/collectors/${encodeURIComponent(this.collectorId)}/refactor_template`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify({ prompt: prompt.slice(0, 1000), custom_input: customInput })
    });
    if (!response.ok) throw new Error(`Bright Data self-heal trigger failed: ${response.status} ${await response.text()}`);
    await response.json().catch(() => ({}));

    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      const progress = await this.request(`${API}/dca/collectors/${encodeURIComponent(this.collectorId)}/refactor_template/progress`, { headers: { Authorization: `Bearer ${this.token}` } });
      if ([401, 403, 404, 422].includes(progress.status)) throw new Error(`Bright Data heal polling failed: ${progress.status} ${await progress.text()}`);
      if (!progress.ok) { await sleep(this.pollMs); continue; }
      const body = await progress.json();
      const status = String(body.status ?? body.state ?? '').toLowerCase();
      if (['done', 'completed', 'success', 'ready'].includes(status) || body.template || body.code) return body;
      if (['failed', 'error'].includes(status)) throw new Error(`Bright Data self-heal failed: ${JSON.stringify(body)}`);
      await sleep(this.pollMs);
    }
    throw new Error(`Bright Data self-heal timed out after ${this.timeoutMs}ms.`);
  }
}
