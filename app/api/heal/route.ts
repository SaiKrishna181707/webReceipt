import { getService } from '@/lib/server/service'
import { createControlledProductSession, isControlledProductTarget, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function optionalString(value: unknown, field: string): string | undefined {
  if (value == null || value === '') return undefined
  if (typeof value !== 'string') throw new Error(`${field} must be a string.`)
  const normalized = value.trim()
  return normalized || undefined
}

export async function POST(req: Request) {
  return runSafely(async () => {
    const body = await readBody(req)
    const targetUrl = optionalString(body.targetUrl, 'targetUrl')
    const mutation = optionalString(body.mutation, 'mutation') || 'wrong-valid-total'

    if (isControlledProductTarget(targetUrl)) {
      const { service } = await createControlledProductSession()
      return service.observe({ targetUrl, mutation, autoHeal: true })
    }

    if (!isSimulatorTarget(targetUrl)) {
      throw new Error(
        'Live public URLs are observed read-only. Real self-healing requires the protected Bright Data live workflow; WebReceipt will not fake a repair on a third-party page.',
      )
    }

    const service = await getService()
    return service.observe({ targetUrl, mutation, autoHeal: true })
  })
}
