const API = 'https://api.brightdata.com';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const TERMINAL_FAILURES = new Set(['failed', 'error', 'cancelled']);
const COMPLETE_STATUSES = new Set(['done', 'completed', 'success', 'ready']);
const APPROVAL_STATUS = 'pending_answer';

function numericEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function retryDelay(response, attempt) {
  const header = response?.headers?.get?.('retry-after');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 30_000);
  }
  return Math.min(250 * (2 ** attempt), 8_000);
}

export function firstPreviewRecord(previewResult) {
  if (Array.isArray(previewResult)) return previewResult[0] ?? null;
  if (previewResult && typeof previewResult === 'object' && Array.isArray(previewResult.data)) return previewResult.data[0] ?? null;
  if (previewResult && typeof previewResult === 'object') return previewResult;
  return null;
}

export class BrightDataCollector {
  constructor({
    token = process.env.BRIGHT_DATA_API_TOKEN,
    collectorId = process.env.BRIGHT_DATA_COLLECTOR_ID,
    pollMs = numericEnv('BRIGHT_DATA_POLL_MS', 5000),
    collectionTimeoutMs = numericEnv('BRIGHT_DATA_COLLECTION_TIMEOUT_MS', 240000),
    healTimeoutMs = numericEnv('BRIGHT_DATA_HEAL_TIMEOUT_MS', 900000),
    requestTimeoutMs = numericEnv('BRIGHT_DATA_REQUEST_TIMEOUT_MS', 30000),
    retries = 3,
    autoSaveHeal = true,
  } = {}) {
    this.kind = 'brightdata';
    this.token = token;
    this.collectorId = collectorId;
    this.pollMs = pollMs;
    this.collectionTimeoutMs = collectionTimeoutMs;
    this.healTimeoutMs = healTimeoutMs;
    this.requestTimeoutMs = requestTimeoutMs;
    this.retries = retries;
    this.autoSaveHeal = autoSaveHeal;
  }

  assertConfigured() {
    if (!this.token || !this.collectorId) throw new Error('Bright Data mode requires BRIGHT_DATA_API_TOKEN and BRIGHT_DATA_COLLECTOR_ID.');
  }

  headers() { return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }; }

  async request(url, options = {}) {
    let last;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      let response;
      try {
        const signal = options.signal ?? AbortSignal.timeout(this.requestTimeoutMs);
        response = await fetch(url, { ...options, signal });
        if (!RETRYABLE.has(response.status) || attempt === this.retries) return response;
        await response.arrayBuffer().catch(() => {});
        last = new Error(`Bright Data transient HTTP ${response.status}`);
      } catch (error) {
        last = error;
        if (attempt === this.retries) throw error;
      }
      await sleep(retryDelay(response, attempt));
    }
    throw last ?? new Error('Bright Data request failed.');
  }

  async collect({ url }) {
    this.assertConfigured();
    if (!url) throw new Error('Bright Data collection requires a URL input.');
    const trigger = await this.request(`${API}/dca/trigger?collector=${encodeURIComponent(this.collectorId)}&queue_next=1`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify([{ url }])
    });
    if (!trigger.ok) throw new Error(`Bright Data trigger failed: ${trigger.status} ${(await trigger.text()).slice(0, 800)}`);
    const triggerBody = await trigger.json();
    const snapshotId = triggerBody.collection_id;
    if (!snapshotId) throw new Error(`Bright Data trigger response did not include collection_id: ${JSON.stringify(triggerBody)}`);

    const deadline = Date.now() + this.collectionTimeoutMs;
    while (Date.now() < deadline) {
      const response = await this.request(`${API}/dca/dataset?id=${encodeURIComponent(snapshotId)}`, { headers: { Authorization: `Bearer ${this.token}` } });
      if ([401, 403, 404, 422].includes(response.status)) throw new Error(`Bright Data dataset fetch failed: ${response.status} ${(await response.text()).slice(0, 800)}`);
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
    throw new Error(`Bright Data collection timed out after ${this.collectionTimeoutMs}ms.`);
  }

  async pollHealProgress({ deadline = Date.now() + this.healTimeoutMs, phase = 'self-heal' } = {}) {
    while (Date.now() < deadline) {
      const progress = await this.request(`${API}/dca/collectors/${encodeURIComponent(this.collectorId)}/refactor_template/progress`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if ([401, 403, 404, 422].includes(progress.status)) throw new Error(`Bright Data ${phase} polling failed: ${progress.status} ${(await progress.text()).slice(0, 800)}`);
      if (!progress.ok) { await sleep(this.pollMs); continue; }

      const body = await progress.json();
      const status = String(body.status ?? body.state ?? '').toLowerCase();
      if (TERMINAL_FAILURES.has(status)) throw new Error(`Bright Data ${phase} failed: ${JSON.stringify(body).slice(0, 1600)}`);
      if (status === APPROVAL_STATUS) return { state: 'awaiting_approval', body };
      if (COMPLETE_STATUSES.has(status)) return { state: 'done', body };
      await sleep(this.pollMs);
    }
    throw new Error(`Bright Data ${phase} timed out after ${this.healTimeoutMs}ms.`);
  }

  async respondToHeal({ approve, autoSave = this.autoSaveHeal } = {}) {
    this.assertConfigured();
    if (typeof approve !== 'boolean') throw new Error('Self-heal response requires approve=true or false.');
    const body = approve && autoSave ? { message: true, auto_save: true } : { message: approve };
    const response = await this.request(`${API}/dca/collectors/${encodeURIComponent(this.collectorId)}/resume_automation_job`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Bright Data self-heal ${approve ? 'approval' : 'rejection'} failed: ${response.status} ${(await response.text()).slice(0, 800)}`);
    await response.text().catch(() => '');
    const completion = await this.pollHealProgress({ deadline: Date.now() + this.healTimeoutMs, phase: approve ? 'self-heal approval' : 'self-heal rejection' });
    if (completion.state === 'awaiting_approval') throw new Error('Bright Data self-heal returned to the approval gate after a response.');
    return { ...completion.body, approval: approve ? 'approved' : 'rejected', autoSaved: Boolean(approve && autoSave) };
  }

  async approveHeal({ autoSave = this.autoSaveHeal } = {}) {
    return this.respondToHeal({ approve: true, autoSave });
  }

  async rejectHeal() {
    return this.respondToHeal({ approve: false, autoSave: false });
  }

  async heal({ prompt }) {
    this.assertConfigured();
    const semanticPrompt = String(prompt ?? '').trim();
    if (!semanticPrompt) throw new Error('Bright Data self-heal requires a non-empty semantic repair prompt.');

    // Match the official Bright Data CLI: the repair request mutates scraper code
    // and does not smuggle the target URL into custom_input. The collector's own
    // saved preview/input configuration remains the source of preview inputs.
    const response = await this.request(`${API}/dca/collectors/${encodeURIComponent(this.collectorId)}/refactor_template`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify({ prompt: semanticPrompt.slice(0, 1000), custom_input: [] })
    });
    if (!response.ok) throw new Error(`Bright Data self-heal trigger failed: ${response.status} ${(await response.text()).slice(0, 800)}`);
    await response.json().catch(() => ({}));

    const proposal = await this.pollHealProgress({ deadline: Date.now() + this.healTimeoutMs, phase: 'self-heal proposal' });
    if (proposal.state === 'done') return { ...proposal.body, approval: 'not_required', previewResult: proposal.body.preview_result ?? null };

    // Deliberately never auto-approve here. Only the orchestrator may call
    // approveHeal(), after compiling and verifying preview_result.
    return {
      ...proposal.body,
      status: 'awaiting_approval',
      approval: 'required',
      previewResult: proposal.body.preview_result ?? null,
      diff: proposal.body.diff ?? null,
    };
  }
}
