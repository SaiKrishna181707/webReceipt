import { NextResponse } from 'next/server'
import { brightDataBusy, brightDataStatus } from '@/lib/server/brightdata'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const status = brightDataStatus()
  return NextResponse.json({
    ok: true,
    name: 'WebReceipt Bright Data bridge',
    mode: status.configured ? 'brightdata-ready' : 'not-configured',
    collectorId: status.collectorId,
    targetConfigured: status.targetConfigured,
    liveOperation: brightDataBusy(),
    liveAccess: {
      configured: status.configured,
      enabled: status.configured && (status.protected || status.allowUnprotectedLive),
      protected: status.protected,
    },
    now: new Date().toISOString(),
  })
}
