import { JsonStore } from './services/store.js';
import { WebReceiptService } from './services/orchestrator.js';
import { SimulatorCollector } from './integrations/simulator.js';
const store = new JsonStore('data/stress-state.json'); await store.reset();
const service = new WebReceiptService({ collector: new SimulatorCollector(), store });
const run = await service.stress();
console.table(run.results);
console.log(`\nRecovered ${run.recovered}/${run.total} mutation scenarios in ${run.durationMs}ms.`);
if (run.recovered !== run.total) process.exitCode = 1;
