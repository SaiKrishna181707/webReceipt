import { healthyObservation, mutationObservation } from '../fixtures/observations.js';

export class SimulatorCollector {
  constructor() { this.kind = 'simulator'; this.healed = new Set(); }

  inject(mutation) { if (mutation && mutation !== 'healthy') this.healed.delete(mutation); }

  async collect({ mutation = 'healthy' } = {}) {
    await delay(35);
    if (mutation === 'healthy') return healthyObservation();
    if (this.healed.has(mutation)) return healthyObservation({ collectorVersion: `healed-${mutation}` });
    return mutationObservation(mutation);
  }

  async heal({ mutation, prompt }) {
    await delay(45);
    this.healed.add(mutation);
    return { status: 'completed', mutation, prompt, collectorVersion: `healed-${mutation}` };
  }

  reset() { this.healed.clear(); }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
