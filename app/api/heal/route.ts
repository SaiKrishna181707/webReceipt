import { getService } from '@/lib/server/service'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Trigger the self-heal loop for a broken mutation: re-observe with autoHeal on
// so the engine requests a Scraper Studio repair, verifies the untrusted preview
// against every contract invariant, deploys it, and re-runs the collector.
export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const service = await getService()
    return service.observe({
      targetUrl: (body.targetUrl as string) || undefined,
      mutation: (body.mutation as string) || 'wrong-valid-total',
      autoHeal: true,
    })
  })
}
