import { getSimulator } from '@/lib/server/service'
import { runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Browser-visible history is cleared locally by lib/api. Reset only the
// deterministic simulator state; never erase a process-global ledger that may
// contain another visitor's internal engine records.
export async function POST() {
  return runSafely(async () => {
    getSimulator().reset()
    return { contracts: [], events: [], stressRuns: [] }
  })
}
