import { getPublicWebService, getService } from '@/lib/server/service'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function isDemoTarget(targetUrl?: string): boolean {
  if (!targetUrl) return true
  try {
    return new URL(targetUrl).hostname === 'demo.webreceipt.dev'
  } catch {
    return false
  }
}

// Trigger the verified repair loop for a simulated broken extraction. The
// built-in fixture uses the original simulator; third-party public pages use a
// safe extraction-mapping repair simulation and never mutate the target site.
// Protected Bright Data scraper-code healing remains under /api/brightdata/heal.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const targetUrl = (body.targetUrl as string) || undefined
    const service = isDemoTarget(targetUrl) ? await getService() : await getPublicWebService()
    return service.observe({
      targetUrl,
      mutation: (body.mutation as string) || 'wrong-valid-total',
      autoHeal: true,
    })
  })
}
