'use client'

import dynamic from 'next/dynamic'

/* The tunnel is client-only: it measures the viewport before it can size its
   drawing buffer, so there is nothing useful to render on the server. */
const LightTunnel = dynamic(() => import('@/components/effects/light-tunnel'), { ssr: false })

/* ============================================================================
   THE ENVIRONMENT

   Four layers, back to front:

     1  true black + a low green fog   (body::before, in the stylesheet)
     2  the tunnel                     (WebGL — cables running to a vanishing
                                        point, with data pulses along them)
     3  drifting system symbols        (CSS)
     4  the interface                  (everything else on the page)

   All of it is fixed, `aria-hidden`, and pointer-transparent. It is atmosphere:
   it must never intercept a click or be announced to a screen reader.

   This is the one shader held for the life of the page. Everything else in
   `components/effects/` mounts through `GatedEffect` and gives its GL context
   back when it scrolls away.

   The old CSS floor grid and dust are gone: the tunnel already supplies depth and
   perspective, and stacking a grid on top of it read as two competing horizons.
   ========================================================================== */

/** A few glyphs adrift in the depth of field, well behind the UI. */
const DRIFT = [
  { char: 'ﾊ', left: '7%', top: '18%', size: 92, delay: '0s', dur: '17s' },
  { char: '$', left: '88%', top: '26%', size: 64, delay: '2.4s', dur: '21s' },
  { char: 'ｷ', left: '72%', top: '72%', size: 116, delay: '5.1s', dur: '19s' },
  { char: '0', left: '17%', top: '78%', size: 72, delay: '7.6s', dur: '23s' },
]

export function MatrixBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* L2 — the tunnel. Masked at the top so the navigation stays legible and
          at the bottom so it sinks into the black rather than stopping. */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, #000 22%, #000 72%, rgba(0,0,0,.25) 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, #000 22%, #000 72%, rgba(0,0,0,.25) 100%)',
        }}
      >
        {/* Dim and slow on purpose. This sits under live integrity data on
            /console; anything brighter competes with the numbers. */}
        <LightTunnel opacity={0.5} brightness={0.85} speed={0.08} cableCount={22} glow={0.9} mouseStrength={0.06} />
      </div>

      {/* L3 */}
      {DRIFT.map((d) => (
        <span
          key={d.char + d.left}
          className="absolute select-none font-mono font-bold leading-none text-matrix-400 animate-float"
          style={{
            left: d.left,
            top: d.top,
            fontSize: d.size,
            opacity: 0.055,
            animationDelay: d.delay,
            animationDuration: d.dur,
          }}
        >
          {d.char}
        </span>
      ))}
    </div>
  )
}
