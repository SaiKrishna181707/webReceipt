import { getSimulator } from '@/lib/server/service'
import { runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public receipt history is per-browser and is cleared by lib/api.ts. This route
// only resets the deterministic simulator's in-process mutation state; it must
// never erase a process-global ledger that may contain another visitor's work.
export async function POST() {
  return runSafely(async () => {
    getSimulator().reset()
    return { contracts: [], events: [], stressRuns: [] }
  })
}
