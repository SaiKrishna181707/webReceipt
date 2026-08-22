import { getStore, getSimulator } from '@/lib/server/service'
import { getPublicWebCollector } from '@/lib/server/public-web'
import { runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Clear stored receipts/events and all in-memory repair state so both the
// deterministic demo and arbitrary public-URL flow can restart cleanly.
export async function POST() {
  return runSafely(async () => {
    getSimulator().reset()
    ;(await getPublicWebCollector()).reset()
    return (await getStore()).reset()
  })
}
