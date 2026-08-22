import { PublicWebCollector } from '@/src/integrations/public-web-production.js'
import { securePublicFetch } from '@/src/integrations/pinned-public-fetch.js'
import { WebReceiptService } from '@/src/services/orchestrator.js'
import { getStore } from '@/lib/server/service'

export type PublicWebSession = {
  collector: InstanceType<typeof PublicWebCollector>
  service: InstanceType<typeof WebReceiptService>
}

/**
 * Create an isolated public-web collector/service pair for one API request.
 *
 * PublicWebCollector intentionally carries transient repair state (`lastTargetUrl`
 * and the healed-mutation set). Sharing one collector across anonymous requests
 * lets concurrent visitors overwrite that state during Observe/Break/Heal. The
 * durable/event store can remain shared, but collector state must not be.
 *
 * The production fetch implementation pins each public socket to the DNS address
 * that passed the private/reserved-network check. This closes the DNS-rebinding
 * gap between validating a hostname and opening the outbound connection.
 */
export async function createPublicWebSession(): Promise<PublicWebSession> {
  const store = await getStore()
  const collector = new PublicWebCollector({ fetchImpl: securePublicFetch })
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

export function isSimulatorTarget(rawUrl?: string): boolean {
  const value = String(rawUrl || '').trim()
  if (!value) return true
  const url = parseTarget(value)
  if (!url) return false
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (hostname === 'demo.webreceipt.dev') return true
  return url.pathname === '/fixture/hotel' && ['localhost', '127.0.0.1', '::1'].includes(hostname)
}
