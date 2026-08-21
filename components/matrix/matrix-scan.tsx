'use client'

import { ShieldCheck, Radar, Loader2 } from 'lucide-react'
import { scanReadout, type ScanPhase } from './use-scan'

/**
 * The visible half of the scan system: a sweeping line, a film of digital
 * noise, and the terminal readout. Mount it inside any `.scan-host`; it renders
 * nothing at all when idle, so it costs one null check per frame of the page's
 * life rather than an always-running animation.
 */
export function ScanOverlay({ phase }: { phase: ScanPhase }) {
  if (phase === 'idle') return null

  const Icon = phase === 'granted' ? ShieldCheck : phase === 'verifying' ? Loader2 : Radar

  return (
    <>
      <span className="scan-line" aria-hidden />
      <span className="scan-noise" aria-hidden />
      <span className="scan-readout" aria-live="polite">
        <Icon size={11} className={phase === 'verifying' ? 'animate-spin' : ''} aria-hidden />
        {scanReadout(phase)}
      </span>
    </>
  )
}

/**
 * A hover-only sweep for surfaces that aren't clickable but should still feel
 * powered — section headers, evidence panels, ledger rows.
 */
export function HoverScan() {
  return <span className="scan-line scan-line-hover" aria-hidden />
}
