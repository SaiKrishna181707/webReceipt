import { getPublicWebService, getService } from '@/lib/server/service'
import { brightDataStatus, getBrightDataService, VERIFIED_BRIGHT_DATA_TARGET, withBrightDataLock } from '@/lib/server/brightdata'
import { runSafely, readBody } from '@/lib/server/handler'
import { withPublicScrapeLimit } from '@/lib/server/public-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value)
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function isDemoTarget(targetUrl?: string): boolean {
  if (!targetUrl) return true
  const normalized = normalizeUrl(targetUrl)
  if (!normalized) return false
  return new URL(normalized).hostname === 'demo.webreceipt.dev'
}

function shouldUseBrightData(targetUrl?: string): boolean {
  if (!targetUrl || !brightDataStatus().configured) return false
  const normalizedTarget = normalizeUrl(targetUrl)
  if (!normalizedTarget) return false

  // The existing Scraper Studio collector is deliberately specialized for the
  // verified WebReceipt proof fixture. Never send arbitrary anonymous URLs to
  // that paid, fixture-specific worker: ordinary public URLs use the hardened
  // generic public-web collector instead.
  const configuredTarget = String(process.env.BRIGHT_DATA_TARGET_URL || '').trim()
  const allowedTarget = normalizeUrl(configuredTarget || VERIFIED_BRIGHT_DATA_TARGET)
  return Boolean(allowedTarget && normalizedTarget === allowedTarget)
}

// Run one public journey and compile it into a Deal Contract.
// - The built-in demo stays deterministic and simulator-backed.
// - The verified proof fixture can use the existing Bright Data collector.
// - Any other public HTTP(S) deal page uses the hardened generic collector,
//   which validates DNS/redirect targets and never accesses login/private URLs.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const targetUrl = (body.targetUrl as string) || undefined
    const mutation = (body.mutation as string) || 'healthy'

    if (isDemoTarget(targetUrl)) {
      const service = await getService()
      return service.observe({
        targetUrl,
        mutation,
        autoHeal: body.autoHeal === true,
      })
    }

    if (mutation === 'healthy' && shouldUseBrightData(targetUrl)) {
      const service = await getBrightDataService()
      return withBrightDataLock(() => service.observe({
        targetUrl,
        mutation: 'healthy',
        autoHeal: false,
      }))
    }

    const service = await getPublicWebService()
    return withPublicScrapeLimit(req, () => service.observe({
      targetUrl,
      mutation,
      autoHeal: false,
    }))
  })
}
