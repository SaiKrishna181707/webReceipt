import fs from 'node:fs/promises';
import path from 'node:path';

export class JsonStore {
  constructor(file = path.resolve('data/state.json')) {
    this.file = file;
    this.state = { contracts: [], events: [], stressRuns: [] };
    this.writeQueue = Promise.resolve();
  }

  async load() {
    try { this.state = JSON.parse(await fs.readFile(this.file, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; await this.save(); }
    return this.state;
  }

  save() {
    const snapshot = JSON.stringify(this.state, null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      await fs.writeFile(tmp, snapshot);
      await fs.rename(tmp, this.file);
    });
    return this.writeQueue;
  }

  async reset() {
    this.state = { contracts: [], events: [], stressRuns: [] };
    await this.save();
    return this.state;
  }

  async event(type, message, meta = {}) {
    this.state.events.unshift({ id: crypto.randomUUID(), type, message, meta, at: new Date().toISOString() });
    this.state.events = this.state.events.slice(0, 100);
    await this.save();
  }

  async addContract(contract, integrity, anomalies) {
    this.state.contracts.unshift({ contract, integrity, anomalies });
    this.state.contracts = this.state.contracts.slice(0, 20);
    await this.save();
  }

  async addStressRun(run) {
    this.state.stressRuns.unshift(run);
    this.state.stressRuns = this.state.stressRuns.slice(0, 20);
    await this.save();
  }
}
