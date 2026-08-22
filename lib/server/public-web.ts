import { PublicWebCollector } from '@/src/integrations/public-web.js'
import { WebReceiptService } from '@/src/services/orchestrator.js'
import { getStore } from '@/lib/server/service'

type RateBucket = { count: number; resetAt: number }
type PublicWebGlobal = { __webreceiptPublicWebRate?: Map<string, RateBucket> }

const globalRef = globalThis as unknown as PublicWebGlobal

// Public scraping is request-scoped. That keeps repair state isolated between
// users while the receipt/event store remains shared. The adapter below supplies
// the current target to the generic verified-heal protocol without modifying the
// existing orchestrator or any UI code.
class RequestPublicWebCollector extends PublicWebCollector {
  private lastTargetUrl: string | null = null

  inject(_mutation?: string) {
    // A fresh collector starts clean for every request, so there is no healed
    // state from a previous click/user to invalidate here.
  }

  async collect(args: { url?: string; mutation?: string } = {}) {
    if (args.url) this.lastTargetUrl = args.url
    return super.collect(args)
  }

  async heal(args: { mutation?: string; prompt?: string } = {}) {
    return super.heal({ ...args, targetUrl: this.lastTargetUrl })
  }

  async approveHeal(args: { mutation?: string; autoSave?: boolean } = {}) {
    return super.approveHeal({ ...args, targetUrl: this.lastTargetUrl })
  }

  async rejectHeal(args: { mutation?: string } = {}) {
    return super.rejectHeal({ ...args, targetUrl: this.lastTargetUrl })
  }
}

export async function getPublicWebService() {
  const store = await getStore()
  const collector = new RequestPublicWebCollector()
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
