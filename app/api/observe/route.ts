import { getService } from '@/lib/server/service'
import { createControlledProductSession, createPublicWebSession, isControlledProductTarget, isSimulatorTarget } from '@/lib/server/public-web'
import { runSafely, readBody } from '@/lib/server/handler'
import { withPublicScrapeLimit } from '@/lib/server/public-limit'

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
    const mutation = optionalString(body.mutation, 'mutation') || 'healthy'
    if (body.autoHeal != null && typeof body.autoHeal !== 'boolean') throw new Error('autoHeal must be a boolean.')

    // The public /fixture/product URL is our deterministic replay, not a real
    // retailer. Give it a request-scoped controlled collector so the semantic
    // drift/heal loop works on the deployed hostname without treating every
    // third-party URL as simulator data.
    if (isControlledProductTarget(targetUrl)) {
      const { service } = await createControlledProductSession()
      return service.observe({ targetUrl, mutation, autoHeal: body.autoHeal === true })
    }

    if (isSimulatorTarget(targetUrl)) {
      const service = await getService()
      return service.observe({ targetUrl, mutation, autoHeal: body.autoHeal === true })
    }

    // Third-party URLs are read-only observations. Never manufacture a mutation
    // or invoke a simulated repair path against a real retailer page.
    if (mutation !== 'healthy') {
      throw new Error('Live public URLs only accept mutation="healthy". Real semantic drift and self-healing must run through the Bright Data live workflow.')
    }

    return withPublicScrapeLimit(req, async () => {
      const { service } = await createPublicWebSession()
      return service.observe({ targetUrl, mutation: 'healthy', autoHeal: false })
    })
  })
}
