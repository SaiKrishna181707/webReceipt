import { PublicWebCollector } from '@/src/integrations/public-web-production.js'
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
