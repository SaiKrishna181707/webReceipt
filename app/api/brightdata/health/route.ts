import { NextResponse } from 'next/server'
import { brightDataBusy, brightDataStatus, VERIFIED_BRIGHT_DATA_TARGET } from '@/lib/server/brightdata'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function enabled(name: string): boolean {
  return /^(1|true|yes)$/i.test(String(process.env[name] || '').trim())
}

export async function GET() {
  const status = brightDataStatus()
  const publicTarget = String(process.env.BRIGHT_DATA_TARGET_URL || '').trim() || VERIFIED_BRIGHT_DATA_TARGET
  return NextResponse.json({
    ok: true,
    name: 'WebReceipt Bright Data bridge',
    mode: status.configured ? 'brightdata-ready' : 'not-configured',
    collectorId: status.collectorId,
    targetConfigured: status.targetConfigured,
    liveOperation: brightDataBusy(),
    browserObserve: {
      enabled: status.configured,
      target: publicTarget,
      arbitraryPublicTargets: status.configured && enabled('WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE'),
    },
    liveAccess: {
      configured: status.configured,
      enabled: status.configured && (status.protected || status.allowUnprotectedLive),
      protected: status.protected,
    },
    now: new Date().toISOString(),
  })
}
