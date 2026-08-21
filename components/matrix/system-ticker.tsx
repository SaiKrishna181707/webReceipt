'use client'

import { Boxes, ShieldCheck, Fingerprint, GitCompare, Wrench, TerminalSquare } from 'lucide-react'

/* ============================================================================
   SYSTEM FEED

   A slow marquee of what this system is, not what it is currently doing. Every
   item is a static capability label — the feed never invents a live reading, a
   run count or a verification result, because a decorative strip is exactly
   where a fake number would go unnoticed.

   The last item is deliberate: the Next.js app runs against the simulated
   collector, and the interface says so on every page.
   ========================================================================== */

const FEED = [
  { icon: Boxes, label: 'Deal Contract v1.1.0', tone: '#33ff66' },
  { icon: ShieldCheck, label: 'Integrity engine · 11 checks', tone: '#3fbf66' },
  { icon: Fingerprint, label: 'Evidence · SHA-256', tone: '#2fe3ba' },
  { icon: GitCompare, label: 'Promise diff', tone: '#3fbf66' },
  { icon: Wrench, label: 'Verified self-healing', tone: '#33ff66' },
  { icon: TerminalSquare, label: 'Collector · simulated', tone: 'rgba(169,201,177,.6)' },
]

export function SystemTicker() {
  const row = (prefix: string) => (
    <div className="flex shrink-0 items-center gap-2.5 pr-2.5">
      {FEED.map(({ icon: Icon, label, tone }, i) => (
        <span
          key={`${prefix}-${i}`}
          className="inline-flex items-center gap-2 rounded-[2px] border px-3 py-1.5"
          style={{
            borderColor: `color-mix(in srgb, ${tone} 26%, transparent)`,
            background: `color-mix(in srgb, ${tone} 5%, rgba(0,0,0,.5))`,
          }}
        >
          <Icon size={12} style={{ color: tone }} aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: tone }}>
            {label}
          </span>
        </span>
      ))}
    </div>
  )

  return (
    <div
      aria-hidden
      className="relative flex overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
    >
      <div className="flex animate-marquee" style={{ ['--duration' as string]: '48s', ['--gap' as string]: '0.625rem' }}>
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
