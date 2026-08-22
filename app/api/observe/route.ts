import { getService } from '@/lib/server/service'
import { getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'
import { withPublicScrapeLimit } from '@/lib/server/public-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const targetUrl = (body.targetUrl as string) || undefined
    const mutation = (body.mutation as string) || 'healthy'
    if (isSimulatorTarget(targetUrl)) {
      const service = await getService()
      return service.observe({ targetUrl, mutation, autoHeal: body.autoHeal === true })
    }
    return withPublicScrapeLimit(req, async () => {
      const service = await getPublicWebService()
      return service.observe({ targetUrl, mutation, autoHeal: body.autoHeal === true })
    })
  })
}
