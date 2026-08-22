import { getService } from '@/lib/server/service'
import { assertPublicWebRateLimit, getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Trigger the verified repair loop for the currently selected target. The demo
// keeps its deterministic simulator; real public URLs use a fresh public-page
// reparse as the untrusted preview before post-repair verification.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const targetUrl = (body.targetUrl as string) || undefined
    const mutation = (body.mutation as string) || 'wrong-valid-total'

    if (isSimulatorTarget(targetUrl)) {
      const service = await getService()
      return service.observe({ targetUrl, mutation, autoHeal: true })
    }

    assertPublicWebRateLimit(req)
    const service = await getPublicWebService()
    return service.observe({ targetUrl, mutation, autoHeal: true })
  })
}
