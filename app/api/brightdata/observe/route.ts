import { getBrightDataService, requireBrightDataOperator, resolveBrightDataTarget, withBrightDataLock } from '@/lib/server/brightdata'
import { readBody, runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Real Bright Data Scraper Studio collection path for the deployed Next.js app.
// The existing product UI never calls this route, so simulator behavior remains
// unchanged. Judges/operators can drive this endpoint from curl or a coding agent.
export async function POST(req: Request) {
  return runSafely(async () => {
    requireBrightDataOperator(req)
    const body = await readBody(req)
    const targetUrl = resolveBrightDataTarget(body)
    const service = await getBrightDataService()

    return withBrightDataLock(() => service.observe({
      targetUrl,
      mutation: 'healthy',
      autoHeal: body.autoHeal === true,
    }))
  })
}
