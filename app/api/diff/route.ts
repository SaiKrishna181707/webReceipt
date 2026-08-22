import { getService, getStore } from '@/lib/server/service'
import { getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Promise Diff. The existing console sends simulate=true. Keep that deterministic
// for the built-in demo, but when the latest receipt came from a real public URL,
// take a fresh observation first and diff the two stored contracts for that URL.
// Explicit simulate=false remains available for API callers that already have
// two observations stored.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const simulator = await getService()

    if (body.simulate === false) {
      return simulator.historyDiff({ targetUrl: body.targetUrl as string | undefined })
    }

    const store = await getStore()
    const latestTarget = store.state.contracts[0]?.contract?.targetUrl as string | undefined
    if (latestTarget && !isSimulatorTarget(latestTarget)) {
      const service = await getPublicWebService()
      await service.observe({ targetUrl: latestTarget, mutation: 'healthy', autoHeal: false })
      return service.historyDiff({ targetUrl: latestTarget })
    }

    return simulator.simulatePromiseDiff()
  })
}
