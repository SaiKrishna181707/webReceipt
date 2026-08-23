import { getService } from '@/lib/server/service'
import { createControlledProductSession, createPublicWebSession, isControlledProductTarget, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'
import { withPublicScrapeLimit } from '@/lib/server/public-limit'
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
  if (seal?.pass !== true || evidence?.pass !== true) throw new Error('Promise Diff rejected a contract with an invalid seal.')
  return integrity
}

async function freshPublicDiff(req: Request, targetUrl: string) {
  return withPublicScrapeLimit(req, async () => {
    const { service } = await createPublicWebSession()
    const first = await service.observe({ targetUrl, mutation: 'healthy', autoHeal: false })
    const second = await service.observe({ targetUrl, mutation: 'healthy', autoHeal: false })
    if (!first.contract || !second.contract) {
      throw new Error('Promise Diff requires two sealed Deal Contracts. This public URL currently provides an offer-only product observation without checkout evidence.')
    }
    return {
      before: first.contract,
      after: second.contract,
      changes: diffContracts(first.contract, second.contract),
      integrity: second.integrity,
      source: 'fresh-public-comparison',
    }
  })
}

async function controlledRepairDiff(targetUrl: string) {
  const { service } = await createControlledProductSession()
  const broken = await service.observe({ targetUrl, mutation: 'wrong-valid-total', autoHeal: false })
  const repaired = await service.observe({ targetUrl, mutation: 'wrong-valid-total', autoHeal: true })
  if (!broken.contract || !repaired.contract) throw new Error('Controlled replay did not produce comparable Deal Contracts.')
  return {
    before: broken.contract,
    after: repaired.contract,
    changes: diffContracts(broken.contract, repaired.contract),
    integrity: repaired.integrity,
    source: 'controlled-repair-comparison',
  }
}

// Anonymous callers never read process-global stored history. They either submit
// their own sealed browser contracts or request a fresh same-request comparison.
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

    const requestedTarget = typeof body.targetUrl === 'string' && body.targetUrl.trim() ? body.targetUrl.trim() : undefined
    if (requestedTarget && isControlledProductTarget(requestedTarget)) return controlledRepairDiff(requestedTarget)
    if (requestedTarget && !isSimulatorTarget(requestedTarget)) return freshPublicDiff(req, requestedTarget)

    const simulator = await getService()
    if (body.simulate === false && requestedTarget) return simulator.historyDiff({ targetUrl: requestedTarget })
    return simulator.simulatePromiseDiff()
  })
}
