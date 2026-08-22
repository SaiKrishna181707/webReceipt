import { getService, getStore } from '@/lib/server/service'
import { getPublicWebService, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'
import { diffContracts } from '@/src/domain/diff.js'
import { evaluateIntegrity } from '@/src/domain/integrity.js'
import type { DealContract } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function requireSealed(contract: DealContract) {
  const integrity = evaluateIntegrity(contract)
  const seal = integrity.checks.find((check: { id: string }) => check.id === 'contract_hash')
  const evidence = integrity.checks.find((check: { id: string }) => check.id === 'evidence_hashes')
  if (seal?.pass !== true || evidence?.pass !== true) {
    throw new Error('Promise Diff rejected a contract with an invalid seal.')
  }
  return integrity
}

// Promise Diff accepts browser-scoped sealed contracts for anonymous public
// users, avoiding any dependency on another visitor's process-global history.
// The original stored-history/simulator modes remain for trusted API/demo use.
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
      return {
        before,
        after,
        changes: diffContracts(before, after),
        integrity,
        source: 'client-history',
      }
    }

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
