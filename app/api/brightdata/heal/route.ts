import { getBrightDataService, requireBrightDataOperator, resolveBrightDataTarget, withBrightDataLock } from '@/lib/server/brightdata'
import { readBody, runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Run the real collector and, only when WebReceipt's semantic integrity checks
// fail, request Bright Data Self-Healing. The orchestrator verifies the untrusted
// preview before approving/saving the repair and then re-runs the same Collector ID.
export async function POST(req: Request) {
  return runSafely(async () => {
    requireBrightDataOperator(req)
    const body = await readBody(req)
    const targetUrl = resolveBrightDataTarget(body)
    const service = await getBrightDataService()

    return withBrightDataLock(() => service.observe({
      targetUrl,
      mutation: 'live-semantic-drift',
      autoHeal: true,
    }))
  })
}
