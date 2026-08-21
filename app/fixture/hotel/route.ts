import { renderHotelFixture } from '@/src/fixture-page.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public, anonymous checkout fixture for the real Bright Data collector.
 * This is intentionally separate from the product UI and requires no login,
 * personal data, or payment interaction.
 *
 * V2 deliberately changes the checkout semantics while keeping the same URL so
 * the hackathon demo can prove same-collector detection and self-healing.
 */
export async function GET() {
  return new Response(renderHotelFixture('v2'), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}
