type RateBucket = { count: number; resetAt: number }

type PublicLimitGlobal = {
  __webreceiptPublicRate?: Map<string, RateBucket>
  __webreceiptPublicActive?: number
}

const globalRef = globalThis as unknown as PublicLimitGlobal
const WINDOW_MS = 60_000
const REQUESTS_PER_WINDOW = 12
const MAX_CONCURRENT = 4

function fail(message: string): never {
  const error = new Error(message) as Error & { status?: number; code?: string }
  error.status = 429
  error.code = 'rate_limited'
  throw error
}

function clientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('x-real-ip')?.trim() || 'anonymous'
}

function rateMap(): Map<string, RateBucket> {
  if (!globalRef.__webreceiptPublicRate) globalRef.__webreceiptPublicRate = new Map()
  return globalRef.__webreceiptPublicRate
}

function consume(req: Request) {
  const now = Date.now()
  const map = rateMap()
  const key = clientKey(req)
  const current = map.get(key)
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + WINDOW_MS }
    : current

  if (bucket.count >= REQUESTS_PER_WINDOW) {
    fail('Public scraping rate limit reached. Try again shortly.')
  }
  bucket.count += 1
  map.set(key, bucket)

  // Prevent an unbounded key map on long-lived Node processes.
  if (map.size > 2000) {
    for (const [candidate, value] of map) {
      if (value.resetAt <= now) map.delete(candidate)
      if (map.size <= 1500) break
    }
  }
}

export async function withPublicScrapeLimit<T>(req: Request, task: () => Promise<T>): Promise<T> {
  consume(req)
  const active = globalRef.__webreceiptPublicActive || 0
  if (active >= MAX_CONCURRENT) fail('Public scraping is busy. Try again shortly.')
  globalRef.__webreceiptPublicActive = active + 1
  try {
    return await task()
  } finally {
    globalRef.__webreceiptPublicActive = Math.max(0, (globalRef.__webreceiptPublicActive || 1) - 1)
  }
}
