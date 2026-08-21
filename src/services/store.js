import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { evaluateIntegrity } from '../domain/integrity.js';
import { detectAnomalies } from '../domain/anomalies.js';

const emptyState = () => ({ contracts: [], events: [], stressRuns: [] });

function revalidateContractEntries(entries) {
  if (!Array.isArray(entries)) return [];
  const out = [];
  for (const entry of entries) {
    if (!entry?.contract || typeof entry.contract !== 'object') continue;
    try {
      out.push({
        contract: entry.contract,
        integrity: evaluateIntegrity(entry.contract),
        anomalies: detectAnomalies(entry.contract),
      });
    } catch {
      // A structurally unusable persisted record must not be rendered/exported as
      // a trustworthy receipt. Keep startup available and drop only that record.
    }
  }
  return out;
}

const normalizeState = (value) => ({
  contracts: revalidateContractEntries(value?.contracts),
  events: Array.isArray(value?.events) ? value.events : [],
  stressRuns: Array.isArray(value?.stressRuns) ? value.stressRuns : []
});

function isInside(directory, file) {
  const relative = path.relative(directory, file);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function resolveStateFile(env = process.env) {
  const configured = String(env.WEBRECEIPT_STATE_FILE || '').trim();
  const onVercel = env.VERCEL === '1' || Boolean(env.VERCEL_ENV);

  if (onVercel) {
    // Vercel Functions do not provide durable writable project storage. Use the
    // platform's writable temp directory so observations succeed instead of
    // failing with EROFS/ENOENT. State is intentionally best-effort/ephemeral
    // until a durable database is configured in a future product deployment.
    const tmp = os.tmpdir();
    if (configured && path.isAbsolute(configured) && isInside(tmp, configured)) return configured;
    return path.join(tmp, 'webreceipt-state.json');
  }

  return path.resolve(configured || 'data/state.json');
}

export class JsonStore {
  constructor(file = resolveStateFile()) {
    this.file = path.resolve(file);
    this.state = emptyState();
    this.writeQueue = Promise.resolve();
  }

  async load() {
    try {
      const raw = await fs.readFile(this.file, 'utf8');
      this.state = normalizeState(JSON.parse(raw));
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.save();
      } else if (error instanceof SyntaxError) {
        await fs.mkdir(path.dirname(this.file), { recursive: true });
        const backup = `${this.file}.corrupt-${Date.now()}`;
        await fs.rename(this.file, backup).catch(() => {});
        this.state = emptyState();
        await this.save();
        console.warn(`WebReceipt recovered from a corrupted state file; backup: ${backup}`);
      } else {
        throw error;
      }
    }
    return this.state;
  }

  save() {
    const snapshot = JSON.stringify(this.state, null, 2);
    this.writeQueue = this.writeQueue.catch(() => {}).then(async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      await fs.writeFile(tmp, snapshot, { mode: 0o600 });
      try {
        await fs.rename(tmp, this.file);
      } catch (err) {
        if (err.code === 'EPERM' || err.code === 'EEXIST' || err.code === 'EBUSY') {
          await fs.copyFile(tmp, this.file);
          await fs.unlink(tmp).catch(() => {});
        } else {
          throw err;
        }
      }
    });
    return this.writeQueue;
  }

  async reset() {
    this.state = emptyState();
    await this.save();
    return this.state;
  }

  async event(type, message, meta = {}) {
    this.state.events.unshift({ id: randomUUID(), type, message, meta, at: new Date().toISOString() });
    this.state.events = this.state.events.slice(0, 120);
    await this.save();
  }

  async addContract(contract) {
    const entry = {
      contract,
      integrity: evaluateIntegrity(contract),
      anomalies: detectAnomalies(contract),
    };
    this.state.contracts.unshift(entry);
    this.state.contracts = this.state.contracts.slice(0, 40);
    await this.save();
    return entry;
  }

  async addStressRun(run) {
    this.state.stressRuns.unshift(run);
    this.state.stressRuns = this.state.stressRuns.slice(0, 20);
    await this.save();
  }
}
