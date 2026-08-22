import { getPublicWebService, getService } from '@/lib/server/service'
import { runSafely, readBody } from '@/lib/server/handler'
import { diffContracts } from '@/src/domain/diff.js'
import { evaluateIntegrity } from '@/src/domain/integrity.js'
import type { DealContract } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isDemoTarget(targetUrl?: string): boolean {
  if (!targetUrl) return true
  try {
    return new URL(targetUrl).hostname === 'demo.webreceipt.dev'
  } catch {
    return false
  }
}

// Promise Diff supports three modes:
// 1) client-history: compare two hash-sealed contracts supplied by this browser;
// 2) live history: compare server-side history for an explicit target;
// 3) the original deterministic day+3 simulator demo.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const before = body.before as DealContract | undefined
    const after = body.after as DealContract | undefined

    if (before && after) {
      if (!before.targetUrl || !after.targetUrl || before.targetUrl !== after.targetUrl) {
        throw new Error('Promise Diff contracts must belong to the same target URL.')
      }
      const integrity = evaluateIntegrity(after)
      if (integrity.checks.find((check: { id: string }) => check.id === 'contract_hash')?.pass !== true) {
        throw new Error('Promise Diff rejected a contract with an invalid seal.')
      }
      return {
        before,
        after,
        changes: diffContracts(before, after),
        integrity,
        source: 'client-history',
      }
    }

    if (body.simulate === false) {
      const targetUrl = body.targetUrl as string | undefined
      const service = isDemoTarget(targetUrl) ? await getService() : await getPublicWebService()
      return service.historyDiff({ targetUrl })
    }

    const service = await getService()
    return service.simulatePromiseDiff()
  })
}
