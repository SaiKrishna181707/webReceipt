import { getService } from '@/lib/server/service'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Run one anonymous public journey and compile it into a Deal Contract.
// autoHeal defaults to false so the console can show the Break (semantic
// failure) state before the operator triggers a repair.
export async function POST(req: Request) {
  const body = await readBody(req)
  return runSafely(async () => {
    const service = await getService()
    return service.observe({
      targetUrl: (body.targetUrl as string) || undefined,
      mutation: (body.mutation as string) || 'healthy',
      autoHeal: body.autoHeal === true,
    })
  })
}
