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
  const unlockerZoneConfigured = Boolean(String(process.env.BRIGHT_DATA_UNLOCKER_ZONE || '').trim())
  const publicUnlockerEnabled = status.configured
    && unlockerZoneConfigured
    && enabled('WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE')

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
      // Direct server-side HTML scraping is always available for safe public
      // targets. Web Unlocker is the production fallback for anti-bot and
      // client-rendered pages and requires token + zone + explicit opt-in.
      directPublicTargets: true,
      webUnlockerConfigured: status.configured && unlockerZoneConfigured,
      arbitraryPublicTargets: publicUnlockerEnabled,
    },
    liveAccess: {
      configured: status.configured,
      enabled: status.configured && (status.protected || status.allowUnprotectedLive),
      protected: status.protected,
    },
    now: new Date().toISOString(),
  })
}
