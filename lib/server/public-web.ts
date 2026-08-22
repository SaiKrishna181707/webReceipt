import { PublicWebCollector } from '@/src/integrations/public-web.js'
import { WebReceiptService } from '@/src/services/orchestrator.js'
import { getStore } from '@/lib/server/service'

// Public collectors are request-scoped so one visitor's simulated repair state
// and last target can never affect another visitor. The shared engine store is
// still reused internally for invariant/event bookkeeping, but anonymous UI
// history is isolated in the browser by lib/api.ts.
export async function getPublicWebService() {
  const store = await getStore()
  const collector = new PublicWebCollector()
  return new WebReceiptService({ collector, store })
}

export function isSimulatorTarget(rawUrl?: string): boolean {
  const value = String(rawUrl || '').trim()
  if (!value) return true
  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
    if (hostname === 'demo.webreceipt.dev') return true
    return url.pathname === '/fixture/hotel' && ['localhost', '127.0.0.1', '::1'].includes(hostname)
  } catch {
    return false
  }
}
