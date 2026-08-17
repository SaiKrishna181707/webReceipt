import { healthyObservation, mutationObservation } from '../fixtures/observations.js';

export class SimulatorCollector {
  constructor() {
    this.kind = 'simulator';
    this.healed = new Set();
  }

  inject(mutation) {
    if (mutation && mutation !== 'healthy') this.healed.delete(mutation);
  }

  async collect({ mutation = 'healthy' } = {}) {
    await delay(20);
    if (mutation === 'healthy') return healthyObservation();
    if (this.healed.has(mutation)) return healthyObservation({ collectorVersion: `healed-${mutation}` });
    return mutationObservation(mutation);
  }

  async heal({ mutation, prompt }) {
    await delay(25);
    return {
      status: 'awaiting_approval',
      approval: 'required',
      mutation,
      prompt,
      previewResult: [healthyObservation({ collectorVersion: `preview-${mutation}` })],
      diff: { template_b: { steps: [{ name: 'semantic-repair' }] } }
    };
  }

  async respondToHeal({ approve, mutation } = {}) {
    await delay(20);
    if (!mutation) throw new Error('Simulator heal response requires the mutation identity.');
    if (approve) this.healed.add(mutation);
    return { status: 'done', approval: approve ? 'approved' : 'rejected', mutation, collectorVersion: approve ? `healed-${mutation}` : `broken-${mutation}` };
  }

  async approveHeal({ mutation } = {}) { return this.respondToHeal({ approve: true, mutation }); }
  async rejectHeal({ mutation } = {}) { return this.respondToHeal({ approve: false, mutation }); }

  reset() {
    this.healed.clear();
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
