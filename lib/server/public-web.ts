import { randomUUID } from 'node:crypto'
import { PublicWebCollector } from '@/src/integrations/public-web-live.js'
import { SimulatorCollector } from '@/src/integrations/simulator.js'
import { securePublicFetch } from '@/src/integrations/pinned-public-fetch.js'
import { WebReceiptService } from '@/src/services/orchestrator.js'
import type { Anomaly, DealContract, Integrity, StoreState, StressRun } from '@/lib/types'

export type PublicWebSession = {
  collector: InstanceType<typeof PublicWebCollector>
  service: InstanceType<typeof WebReceiptService>
}

/**
 * Anonymous public observations are request-scoped end to end.
 *
 * A public collector carries transient target/parser state, and public browser
 * history already lives in localStorage. Persisting anonymous observations in
 * the process-global simulator ledger adds cross-request write contention with
 * no product benefit. This tiny in-memory store gives one request exactly the
 * event/contract surface the orchestrator expects and disappears afterwards.
 */
class RequestStore {
  state: StoreState = { contracts: [], events: [], stressRuns: [] }

  async event(type: string, message: string, meta: Record<string, unknown> = {}) {
    this.state.events.unshift({ id: randomUUID(), type, message, meta, at: new Date().toISOString() })
    this.state.events = this.state.events.slice(0, 120)
  }

  async addContract(contract: DealContract, integrity: Integrity, anomalies: Anomaly[]) {
    this.state.contracts.unshift({ contract, integrity, anomalies })
    this.state.contracts = this.state.contracts.slice(0, 16)
    return this.state.contracts[0]
  }

  async addStressRun(run: StressRun) {
    this.state.stressRuns.unshift(run)
    this.state.stressRuns = this.state.stressRuns.slice(0, 8)
  }
}

/** Create an isolated public-web collector/service pair for one API request. */
export async function createPublicWebSession(): Promise<PublicWebSession> {
  const store = new RequestStore()
  const collector = new PublicWebCollector({ fetchImpl: securePublicFetch })
  const service = new WebReceiptService({ collector, store })
  return { collector, service }
}

/**
 * The deployed /fixture/product route is a controlled WebReceipt replay, but its
 * hostname is a normal public Vercel hostname. Use a request-scoped simulator
 * collector with a non-simulator kind so the orchestrator does not reject that
 * public hostname while preserving the exact fixture parser/heal lifecycle.
 */
export async function createControlledProductSession() {
  const store = new RequestStore()
  const collector = new SimulatorCollector()
  collector.kind = 'controlled'
  const service = new WebReceiptService({ collector, store })
  return { collector, service }
}

function parseTarget(rawUrl?: string): URL | null {
  const value = String(rawUrl || '').trim()
  if (!value) return null
  try {
    if (value.startsWith('//')) return new URL(`https:${value}`)
    if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) return new URL(`https://${value}`)
    return new URL(value)
  } catch {
    return null
  }
}

const CONTROLLED_PRODUCT_HOSTS = new Set([
  'web-receipt-tawny.vercel.app',
  'web-receipt-golden-state-warriors.vercel.app',
  'web-receipt-git-main-golden-state-warriors.vercel.app',
])
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

export function isControlledProductTarget(rawUrl?: string): boolean {
  const url = parseTarget(rawUrl)
  if (!url) return false
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  return CONTROLLED_PRODUCT_HOSTS.has(hostname) && url.pathname === '/fixture/product'
}

/**
 * Simulator-only targets that the long-lived local service is allowed to run.
 * Public Vercel product fixtures are handled by createControlledProductSession.
 */
export function isSimulatorTarget(rawUrl?: string): boolean {
  const value = String(rawUrl || '').trim()
  if (!value) return true
  const url = parseTarget(value)
  if (!url) return false
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (hostname === 'demo.webreceipt.dev') return true
  if (url.pathname === '/fixture/product' && LOCAL_HOSTS.has(hostname)) return true
  return url.pathname === '/fixture/hotel' && LOCAL_HOSTS.has(hostname)
}
