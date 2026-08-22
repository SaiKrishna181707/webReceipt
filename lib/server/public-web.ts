import { PublicWebCollector } from '@/src/integrations/public-web-resilient.js'
import { securePublicFetch } from '@/src/integrations/pinned-public-fetch.js'
import { WebReceiptService } from '@/src/services/orchestrator.js'

type RequestState = {
  contracts: any[]
  events: any[]
  stressRuns: any[]
}

function createRequestStore() {
  const state: RequestState = { contracts: [], events: [], stressRuns: [] }
  return {
    state,
    async event(type: string, message: string, meta: Record<string, unknown> = {}) {
      const item = { id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`, type, message, meta, at: new Date().toISOString() }
      state.events.unshift(item)
      return item
    },
    async addContract(contract: unknown, integrity: unknown, anomalies: unknown) {
      const item = { contract, integrity, anomalies }
      state.contracts.unshift(item)
      return item
    },
    async addStressRun(run: unknown) {
      state.stressRuns.unshift(run)
      return run
    },
    async reset() {
      state.contracts.length = 0
      state.events.length = 0
      state.stressRuns.length = 0
      return state
    },
  }
}

// Every anonymous public scrape gets its own collector and in-memory engine
// ledger. Browser history lives in lib/api.ts, so no request needs to share
// mutable collector or receipt state with another user or another Vercel request.
export async function getPublicWebService() {
  const collector = new PublicWebCollector({ fetchImpl: securePublicFetch })
  return new WebReceiptService({ collector, store: createRequestStore() })
}

export function isSimulatorTarget(rawUrl?: string): boolean {
  const value = String(rawUrl || '').trim()
  if (!value) return true
  try {
    const normalized = /^([A-Za-z][A-Za-z0-9+.-]*:|\/\/)/.test(value) ? value : `https://${value}`
    const url = new URL(normalized.startsWith('//') ? `https:${normalized}` : normalized)
    const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
    if (hostname === 'demo.webreceipt.dev') return true
    return url.pathname === '/fixture/hotel' && ['localhost', '127.0.0.1', '::1'].includes(hostname)
  } catch {
    return false
  }
}
