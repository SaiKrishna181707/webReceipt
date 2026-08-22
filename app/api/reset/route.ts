import { getSimulator } from '@/lib/server/service'
import { runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return runSafely(async () => {
    // Live public collectors are request-scoped and therefore have no shared
    // visitor state to reset. Keep Reset limited to the deterministic simulator;
    // browser receipt/event history is cleared client-side by lib/api.ts.
    getSimulator().reset()
    return { contracts: [], events: [], stressRuns: [] }
  })
}
