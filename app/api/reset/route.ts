import { getStore, getSimulator } from '@/lib/server/service'
import { runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Clear all stored receipts/events and reset the simulator's healed set so the
// demo can be run cleanly from the top again.
export async function POST() {
  return runSafely(async () => {
    getSimulator().reset()
    return (await getStore()).reset()
  })
}
