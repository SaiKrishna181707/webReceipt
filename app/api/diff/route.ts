import { getService, getStore } from '@/lib/server/service'
import { getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'
import { diffContracts } from '@/src/domain/diff.js'
import { evaluateIntegrity } from '@/src/domain/integrity.js'
import type { DealContract } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function requireSealed(contract: DealContract) {
  const integrity = evaluateIntegrity(contract)
  const seal = integrity.checks.find((check: { id: string }) => check.id === 'contract_hash')
  const evidence = integrity.checks.find((check: { id: string }) => check.id === 'evidence_hashes')
  if (seal?.pass !== true || evidence?.pass !== true) throw new Error('Promise Diff rejected a contract with an invalid seal.')
  return integrity
}

// Browser clients can submit their own two sealed observations so anonymous
// users never depend on another visitor's server history. Existing Vercel-safe
// target-driven and deterministic demo fallbacks remain available.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const before = body.before as DealContract | undefined
    const after = body.after as DealContract | undefined

    if (before && after) {
      if (!before.targetUrl || !after.targetUrl || before.targetUrl !== after.targetUrl) {
        throw new Error('Promise Diff contracts must belong to the same target URL.')
      }
      requireSealed(before)
      const integrity = requireSealed(after)
      return { before, after, changes: diffContracts(before, after), integrity, source: 'client-history' }
    }

    const simulator = await getService()
    const requestedTarget = typeof body.targetUrl === 'string' && body.targetUrl.trim() ? body.targetUrl.trim() : undefined

    if (body.simulate === false) return simulator.historyDiff({ targetUrl: requestedTarget })

    const store = await getStore()
    const latestTarget = requestedTarget || (store.state.contracts[0]?.contract?.targetUrl as string | undefined)
    if (latestTarget && !isSimulatorTarget(latestTarget)) {
      const service = await getPublicWebService()
      await service.observe({ targetUrl: latestTarget, mutation: 'healthy', autoHeal: false })
      try { return await service.historyDiff({ targetUrl: latestTarget }) }
      catch (error) {
        if (!/Need at least two stored observations/i.test(errorMessage(error))) throw error
        await service.observe({ targetUrl: latestTarget, mutation: 'healthy', autoHeal: false })
        return service.historyDiff({ targetUrl: latestTarget })
      }
    }
    return simulator.simulatePromiseDiff()
  })
}
