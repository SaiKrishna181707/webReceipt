import { getService } from '@/lib/server/service'
import { brightDataStatus, getBrightDataService, withBrightDataLock } from '@/lib/server/brightdata'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function shouldUseBrightData(targetUrl?: string): boolean {
  if (!targetUrl || !brightDataStatus().configured) return false
  try {
    const url = new URL(targetUrl)
    // Preserve the existing deterministic demo exactly as-is. Any other public
    // URL entered in the console uses the real Scraper Studio collector when
    // deployment credentials are configured.
    return url.hostname !== 'demo.webreceipt.dev'
  } catch {
    return false
  }
}

// Run one anonymous public journey and compile it into a Deal Contract.
// The built-in demo remains simulator-backed. A user-entered public URL is
// collected through Bright Data when the deployment has a real Collector ID.
// Public observe never self-heals or mutates the collector; the protected
// /api/brightdata/heal endpoint owns that operation.
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
