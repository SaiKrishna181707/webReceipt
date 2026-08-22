import { PublicWebCollector } from '@/src/integrations/public-web.js'
import { securePublicFetch } from '@/src/integrations/pinned-public-fetch.js'
import { WebReceiptService } from '@/src/services/orchestrator.js'
import { getStore } from '@/lib/server/service'

// Public collectors are request-scoped so one visitor's simulated repair state
// and last target can never affect another visitor. Direct public HTTP(S) uses a
// DNS-pinned fetch adapter so the address checked for SSRF is the address used by
// the socket. The shared engine store is internal only; anonymous UI history is
// isolated in the browser by lib/api.ts.
export async function getPublicWebService() {
  const store = await getStore()
  const collector = new PublicWebCollector({ fetchImpl: securePublicFetch })
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
