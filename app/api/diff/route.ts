import { getService } from '@/lib/server/service'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Promise Diff. simulate !== false → synthetic "day +3" observation; otherwise
// diff the two most recent stored observations for the same target.
export async function POST(req: Request) {
  const body = await readBody(req)
  return runSafely(async () => {
    const service = await getService()
    return body.simulate === false
      ? service.historyDiff({ targetUrl: body.targetUrl as string | undefined })
      : service.simulatePromiseDiff()
  })
}
