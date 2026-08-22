import { getService, getStore } from '@/lib/server/service'
import { assertPublicWebRateLimit, getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Promise Diff follows the active target. The controlled demo keeps its
// synthetic day+3 path; a pasted public URL compares stored real observations.
// If there is only one public observation, capture one fresh snapshot first so
// the button remains useful instead of returning an avoidable history error.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const store = await getStore()
    const explicitTarget = typeof body.targetUrl === 'string' && body.targetUrl.trim() ? body.targetUrl.trim() : undefined
    const latestTarget = store.state.contracts[0]?.contract?.targetUrl as string | undefined
    const targetUrl = explicitTarget || latestTarget

    if (!targetUrl || isSimulatorTarget(targetUrl)) {
      const service = await getService()
      return body.simulate === false
        ? service.historyDiff({ targetUrl })
        : service.simulatePromiseDiff()
    }

    assertPublicWebRateLimit(req)
    const service = await getPublicWebService()
    try {
      return await service.historyDiff({ targetUrl })
    } catch (error) {
      if (!/Need at least two stored observations/i.test(String((error as Error)?.message || error))) throw error
      await service.observe({ targetUrl, mutation: 'healthy', autoHeal: false })
      return service.historyDiff({ targetUrl })
    }
  })
}
