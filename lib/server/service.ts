// Server-only singleton that reuses the proven Deal Contract engine from
// `src/`. The engine is plain ESM + node built-ins (crypto/fs/net), so it runs
// natively inside Next.js Node route handlers — no logic is duplicated here.
//
// A globalThis guard keeps a single instance alive across dev HMR reloads so the
// in-process simulator "healed" set and the JSON store stay consistent between
// the Break and Heal steps of the console demo.

import { WebReceiptService } from '@/src/services/orchestrator.js'
import { SimulatorCollector } from '@/src/integrations/simulator.js'
import { JsonStore } from '@/src/services/store.js'

interface EngineBundle {
  store: InstanceType<typeof JsonStore>
  simulator: InstanceType<typeof SimulatorCollector>
  service: InstanceType<typeof WebReceiptService>
  ready: Promise<void>
}

const globalRef = globalThis as unknown as { __webreceipt?: EngineBundle }

function createBundle(): EngineBundle {
  const store = new JsonStore()
  const simulator = new SimulatorCollector()
  const service = new WebReceiptService({ collector: simulator, store })
  return { store, simulator, service, ready: store.load().then(() => undefined) }
}

function bundle(): EngineBundle {
  if (!globalRef.__webreceipt) globalRef.__webreceipt = createBundle()
  return globalRef.__webreceipt
}

/** Resolve the shared service after the JSON store has finished loading. */
export async function getService() {
  const b = bundle()
  await b.ready
  return b.service
}

export async function getStore() {
  const b = bundle()
  await b.ready
  return b.store
}

export function getSimulator() {
  return bundle().simulator
}
