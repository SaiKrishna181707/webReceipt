import { getSimulator } from '@/lib/server/service'
import { getPublicWebCollector } from '@/lib/server/public-web'
import { runSafely } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return runSafely(async () => {
    getSimulator().reset()
    ;(await getPublicWebCollector()).reset()
    return { contracts: [], events: [], stressRuns: [] }
  })
}
