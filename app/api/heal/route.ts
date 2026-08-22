import { getService } from '@/lib/server/service'
import { getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { withPublicScrapeLimit } from '@/lib/server/public-limit'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Heal the currently selected target. The controlled proof target uses the
// deterministic simulator repair. Real public URLs are bounded for anonymous
// use and run their verified repair lifecycle within one isolated collector.
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
      const service = await getPublicWebService()
      return service.observe({ targetUrl, mutation, autoHeal: true })
    })
  })
}
