import { getService, getStore } from '@/lib/server/service'
import { getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// Promise Diff. The built-in demo remains deterministic. For a real public URL,
// the client sends the target explicitly so this route does not depend on a
// previous request landing on the same Vercel function instance. We still use
// stored history when it is available; on a fresh instance we take enough fresh
// observations in this same request to produce a valid comparison.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const simulator = await getService()
    const requestedTarget = typeof body.targetUrl === 'string' && body.targetUrl.trim()
      ? body.targetUrl.trim()
      : undefined

    if (body.simulate === false) {
      return simulator.historyDiff({ targetUrl: requestedTarget })
    }

    const store = await getStore()
    const latestTarget = requestedTarget || (store.state.contracts[0]?.contract?.targetUrl as string | undefined)
    if (latestTarget && !isSimulatorTarget(latestTarget)) {
      const service = await getPublicWebService()
      await service.observe({ targetUrl: latestTarget, mutation: 'healthy', autoHeal: false })

      try {
        return await service.historyDiff({ targetUrl: latestTarget })
      } catch (error) {
        if (!/Need at least two stored observations/i.test(errorMessage(error))) throw error
        // Vercel's /tmp state is intentionally ephemeral. If this request landed
        // on a fresh instance, take a second observation here rather than failing
        // a user-visible button because the previous request lived elsewhere.
        await service.observe({ targetUrl: latestTarget, mutation: 'healthy', autoHeal: false })
        return service.historyDiff({ targetUrl: latestTarget })
      }
    }

    return simulator.simulatePromiseDiff()
  })
}
