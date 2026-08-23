import { renderProductFixture } from '@/src/product-fixture-page.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public, anonymous WebReceipt-controlled product fixture.
 *
 * `?version=v1` shows the original product/order semantics. `?version=v2`
 * serves a real DOM redesign where `.total-price` now labels the product price
 * while the actual final total moved to `[data-testid="order-total"]`.
 * No login, personal data, payment, or purchase occurs.
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
