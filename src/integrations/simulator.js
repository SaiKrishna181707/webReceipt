import { healthyObservation, mutationObservation } from '../fixtures/observations.js';
import { scrapeControlledFixture } from './controlled-fixture.js';
import { scrapeProductControlledFixture } from './product-controlled-fixture.js';

const REDESIGN_MUTATION = 'wrong-valid-total';

function fixtureKindFor(url) {
  try {
    return new URL(String(url || '')).pathname.includes('/fixture/product') ? 'product' : 'hotel';
  } catch {
    return 'hotel';
  }
}

function scraperFor(kind) {
  return kind === 'product' ? scrapeProductControlledFixture : scrapeControlledFixture;
}

export class SimulatorCollector {
  constructor() {
    this.kind = 'simulator';
    this.healed = new Set();
    this.currentFixture = 'hotel';
  }

  applyWebsiteChange(mutation) {
    if (mutation && mutation !== 'healthy') this.healed.delete(mutation);
  }

  // Backward-compatible alias for older tests/callers. This no longer mutates
  // extracted data; the wrong value comes from scraping Fixture V2 with the
  // unchanged V1 semantic selector.
  inject(mutation) {
    this.applyWebsiteChange(mutation);
  }

  async collect({ url, mutation = 'healthy' } = {}) {
    await delay(20);
    if (url) this.currentFixture = fixtureKindFor(url);
    const scrape = scraperFor(this.currentFixture);

    if (mutation === 'healthy') {
      return scrape({ websiteVersion: 'v1', scraperVersion: 'v1', targetUrl: url });
    }
    if (mutation === REDESIGN_MUTATION) {
      return scrape({
        websiteVersion: 'v2',
        scraperVersion: this.healed.has(mutation) ? 'v2' : 'v1',
        targetUrl: url,
      });
    }
    if (this.healed.has(mutation)) return healthyObservation({ collectorVersion: `healed-${mutation}` });
    return mutationObservation(mutation);
  }

  async heal({ mutation, prompt }) {
    await delay(25);
    const scrape = scraperFor(this.currentFixture);
    const preview = mutation === REDESIGN_MUTATION
      ? scrape({ websiteVersion: 'v2', scraperVersion: 'v2' })
      : healthyObservation({ collectorVersion: `preview-${mutation}` });
    return {
      status: 'awaiting_approval',
      approval: 'required',
      mutation,
      prompt,
      previewResult: [preview],
      diff: {
        template_b: {
          steps: mutation === REDESIGN_MUTATION
            ? [{ name: 'repair-final-total-selector', from: '.total-price', to: '[data-testid="order-total"]' }]
            : [{ name: 'semantic-repair' }],
        },
      },
    };
  }

  async respondToHeal({ approve, mutation } = {}) {
    await delay(20);
    if (!mutation) throw new Error('Simulator heal response requires the mutation identity.');
    if (approve) this.healed.add(mutation);
    return {
      status: 'done',
      approval: approve ? 'approved' : 'rejected',
      mutation,
      collectorVersion: approve ? `healed-${mutation}` : `broken-${mutation}`,
    };
  }

  async approveHeal({ mutation } = {}) { return this.respondToHeal({ approve: true, mutation }); }
  async rejectHeal({ mutation } = {}) { return this.respondToHeal({ approve: false, mutation }); }

  reset() {
    this.healed.clear();
    this.currentFixture = 'hotel';
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
