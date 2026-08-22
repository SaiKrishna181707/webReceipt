import { PublicWebCollector } from '@/src/integrations/public-web.js'
import { WebReceiptService } from '@/src/services/orchestrator.js'
import { getStore } from '@/lib/server/service'

type PublicWebBundle = {
  collector: InstanceType<typeof PublicWebCollector>
  service: InstanceType<typeof WebReceiptService>
}

type RateBucket = { count: number; resetAt: number }
type PublicWebGlobal = {
  __webreceiptPublicWeb?: Promise<PublicWebBundle>
  __webreceiptPublicWebRate?: Map<string, RateBucket>
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

function requestIdentity(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('x-real-ip')?.trim() || req.headers.get('cf-connecting-ip')?.trim() || 'anonymous'
}

export function assertPublicWebRateLimit(req: Request): void {
  const configured = Number(process.env.WEBRECEIPT_PUBLIC_RATE_LIMIT_PER_MINUTE)
  const limit = Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 12
  const now = Date.now()
  const key = requestIdentity(req)
  const buckets = globalRef.__webreceiptPublicWebRate ??= new Map<string, RateBucket>()
  const existing = buckets.get(key)
  const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : existing

  if (bucket.count >= limit) {
    const error = new Error('Public scraping rate limit exceeded. Try again shortly.') as Error & { status?: number; code?: string }
    error.status = 429
    error.code = 'rate_limited'
    throw error
  }

  bucket.count += 1
  buckets.set(key, bucket)

  if (buckets.size > 2_000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey)
      if (buckets.size <= 1_000) break
    }
  }
}
