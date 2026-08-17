import fs from 'node:fs/promises';
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

export class JsonStore {
  constructor(file = path.resolve(process.env.WEBRECEIPT_STATE_FILE || 'data/state.json')) {
    this.file = file;
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
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      await fs.writeFile(tmp, snapshot, { mode: 0o600 });
      await fs.rename(tmp, this.file);
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
