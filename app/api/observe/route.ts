import { getService } from '@/lib/server/service'
import { assertPublicWebRateLimit, getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Keep the built-in proof target deterministic. Any other safe public URL is
// collected by the production public-web adapter without changing the console UI.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const targetUrl = (body.targetUrl as string) || undefined
    const mutation = (body.mutation as string) || 'healthy'

    if (isSimulatorTarget(targetUrl)) {
      const service = await getService()
      return service.observe({
        targetUrl,
        mutation,
        autoHeal: body.autoHeal === true,
      })
    }

    assertPublicWebRateLimit(req)
    const service = await getPublicWebService()
    return service.observe({
      targetUrl,
      mutation,
      autoHeal: body.autoHeal === true,
    })
  })
}
