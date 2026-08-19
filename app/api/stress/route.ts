import { getService } from '@/lib/server/service'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Chaos Checkout: run a suite of mutations, detecting semantic failures and
// self-healing each, then report how many survived.
export async function POST(req: Request) {
  const body = await readBody(req)
  return runSafely(async () => {
    const service = await getService()
    return service.stress({ mutations: body.mutations as string[] | undefined })
  })
}
