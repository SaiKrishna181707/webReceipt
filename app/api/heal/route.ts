import { getService } from '@/lib/server/service'
import { getPublicWebCollector, getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'
import { withPublicScrapeLimit } from '@/lib/server/public-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Heal the currently selected target. The controlled proof target uses the
// deterministic simulator repair. Real public URLs re-run the public collector,
// verify the proposed healthy preview against the same Deal Contract invariants,
// then approve it before the mandatory post-repair verification run.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const targetUrl = (body.targetUrl as string) || undefined
    const mutation = (body.mutation as string) || 'wrong-valid-total'

    if (isSimulatorTarget(targetUrl)) {
      const service = await getService()
      return service.observe({ targetUrl, mutation, autoHeal: true })
    }

    return withPublicScrapeLimit(req, async () => {
      // Force this transaction to reproduce the broken mapping before verifying
      // and approving its repair; prior visitors must not pre-heal this request.
      ;(await getPublicWebCollector()).reset()
      const service = await getPublicWebService()
      return service.observe({ targetUrl, mutation, autoHeal: true })
    })
  })
}
