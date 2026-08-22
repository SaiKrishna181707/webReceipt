import { getStore, getSimulator } from '@/lib/server/service'
import { runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public collectors are request-scoped, so Reset only needs to clear the shared
// receipt/event store plus the long-lived deterministic simulator state.
export async function POST() {
  return runSafely(async () => {
    getSimulator().reset()
    return (await getStore()).reset()
  })
}
