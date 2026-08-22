import { getService } from '@/lib/server/service'
import { isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'
import { diffContracts } from '@/src/domain/diff.js'
import { evaluateIntegrity } from '@/src/domain/integrity.js'
import type { DealContract } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sameTarget(left: string, right: string): boolean {
  try {
    const a = new URL(left)
    const b = new URL(right)
    a.hash = ''
    b.hash = ''
    return a.toString() === b.toString()
  } catch {
    return left === right
  }
}

function sealIsValid(contract: DealContract): boolean {
  const integrity = evaluateIntegrity(contract)
  return integrity.checks.find((check: { id: string }) => check.id === 'contract_hash')?.pass === true
    && integrity.checks.find((check: { id: string }) => check.id === 'evidence_hashes')?.pass === true
}

// Public Promise Diff is stateless: the browser supplies its two hash-sealed
// observations, so anonymous users never read another visitor's server ledger.
// The original deterministic simulator diff remains unchanged for the demo.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const before = body.before as DealContract | undefined
    const after = body.after as DealContract | undefined

    if (before || after) {
      if (!before || !after) throw new Error('Promise Diff requires both before and after contracts.')
      if (!before.targetUrl || !after.targetUrl || !sameTarget(before.targetUrl, after.targetUrl)) {
        throw new Error('Promise Diff contracts must belong to the same target URL.')
      }
      if (!sealIsValid(before) || !sealIsValid(after)) {
        throw new Error('Promise Diff rejected a contract with an invalid integrity seal.')
      }
      const integrity = evaluateIntegrity(after)
      return {
        before,
        after,
        changes: diffContracts(before, after),
        integrity,
        source: 'client-history',
      }
    }

    const targetUrl = body.targetUrl as string | undefined
    if (body.simulate === false) {
      if (targetUrl && !isSimulatorTarget(targetUrl)) {
        throw new Error('Promise Diff for public URLs requires two sealed browser observations.')
      }
      const service = await getService()
      return service.historyDiff({ targetUrl })
    }

    const service = await getService()
    return service.simulatePromiseDiff()
  })
}
