import { renderProductFixture } from '@/src/product-fixture-page.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public, anonymous WebReceipt-controlled product fixture.
 *
 * The public judge path is a single product URL. The optional `version` query
 * parameter is an internal deterministic test hook used by the semantic-drift
 * acceptance suite; it is not part of the user-facing story.
 */
export async function GET(req: Request) {
  const requested = new URL(req.url).searchParams.get('version')
  const version = requested === 'v2' ? 'v2' : 'v1'
  return new Response(renderProductFixture(version), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}
