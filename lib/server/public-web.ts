import { PublicWebCollector } from '@/src/integrations/public-web.js'
import { WebReceiptService } from '@/src/services/orchestrator.js'
import { getStore } from '@/lib/server/service'

type PublicWebBundle = {
  collector: InstanceType<typeof PublicWebCollector>
  service: InstanceType<typeof WebReceiptService>
}

type PublicWebGlobal = {
  __webreceiptPublicWeb?: Promise<PublicWebBundle>
}

const globalRef = globalThis as unknown as PublicWebGlobal

async function bundle(): Promise<PublicWebBundle> {
  if (!globalRef.__webreceiptPublicWeb) {
    globalRef.__webreceiptPublicWeb = (async () => {
      const store = await getStore()
      const collector = new PublicWebCollector()
      const service = new WebReceiptService({ collector, store })
      return { collector, service }
    })()
  }
  return globalRef.__webreceiptPublicWeb
}

export async function getPublicWebService() {
  return (await bundle()).service
}

export async function getPublicWebCollector() {
  return (await bundle()).collector
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
