import { getService } from '@/lib/server/service'
import { brightDataStatus, getBrightDataService, VERIFIED_BRIGHT_DATA_TARGET, withBrightDataLock } from '@/lib/server/brightdata'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function enabled(name: string): boolean {
  return /^(1|true|yes)$/i.test(String(process.env[name] || '').trim())
}

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value)
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function shouldUseBrightData(targetUrl?: string): boolean {
  if (!targetUrl || !brightDataStatus().configured) return false
  const normalizedTarget = normalizeUrl(targetUrl)
  if (!normalizedTarget) return false

  const target = new URL(normalizedTarget)
  // Preserve the deterministic built-in demo exactly as-is.
  if (target.hostname === 'demo.webreceipt.dev') return false

  // Anonymous browser traffic is allowed to spend Bright Data credits only on
  // the controlled public proof target by default. Operators can still scrape
  // arbitrary public URLs through the protected /api/brightdata/observe route.
  // A future public product can deliberately opt into arbitrary URLs.
  if (enabled('WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE')) return true

  const configuredTarget = String(process.env.BRIGHT_DATA_TARGET_URL || '').trim()
  const allowedTarget = normalizeUrl(configuredTarget || VERIFIED_BRIGHT_DATA_TARGET)
  return Boolean(allowedTarget && normalizedTarget === allowedTarget)
}

// Run one anonymous public journey and compile it into a Deal Contract.
// The built-in demo remains simulator-backed. The controlled public proof URL
// uses Bright Data when the deployment has a token. Public observe never
// self-heals or mutates the collector; the protected /api/brightdata/heal route
// owns mutation/repair operations.
export async function POST(req: Request) {
  const body = await readBody(req)
  return runSafely(async () => {
    const targetUrl = (body.targetUrl as string) || undefined
    const mutation = (body.mutation as string) || 'healthy'

    if (mutation === 'healthy' && shouldUseBrightData(targetUrl)) {
      const service = await getBrightDataService()
      return withBrightDataLock(() => service.observe({
        targetUrl,
        mutation: 'healthy',
        autoHeal: false,
      }))
    }

    const service = await getService()
    return service.observe({
      targetUrl,
      mutation,
      autoHeal: body.autoHeal === true,
    })
  })
}
