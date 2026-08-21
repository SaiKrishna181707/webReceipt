import { renderHotelFixture } from '@/src/fixture-page.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public, anonymous checkout fixture for the real Bright Data collector.
 * This is intentionally separate from the product UI and requires no login,
 * personal data, or payment interaction.
 */
export async function GET() {
  return new Response(renderHotelFixture('v1'), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}
