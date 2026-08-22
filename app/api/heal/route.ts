import { getService } from '@/lib/server/service'
import { createPublicWebSession, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'
import { withPublicScrapeLimit } from '@/lib/server/public-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

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
      // The full break -> preview -> approve -> post-heal verification cycle
      // stays inside one isolated collector instance for this request.
      const { service } = await createPublicWebSession()
      return service.observe({ targetUrl, mutation, autoHeal: true })
    })
  })
}
