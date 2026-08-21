'use client'

import dynamic from 'next/dynamic'

/* Rain is client-only: it measures the viewport before it can lay out columns,
   so there is nothing useful to render on the server. */
const MatrixRain = dynamic(() => import('./matrix-rain').then((m) => m.MatrixRain), { ssr: false })

/* ============================================================================
   THE ENVIRONMENT

   Five layers, back to front:

     1  true black + a low green fog          (body::before, in the stylesheet)
     2  falling code                          (canvas)
     3  perspective floor grid + digital dust (CSS)
     4  drifting system symbols               (CSS)
     5  the interface                          (everything else on the page)

   All of it is fixed, `aria-hidden`, and pointer-transparent. It is atmosphere:
   it must never intercept a click or be announced to a screen reader.
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
      {/* L2 — the code itself. Masked at the top so the navigation stays legible
          and at the bottom so it sinks into the grid rather than stopping. */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, #000 22%, #000 72%, rgba(0,0,0,.25) 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, #000 22%, #000 72%, rgba(0,0,0,.25) 100%)',
        }}
      >
        <MatrixRain fontSize={16} opacity={0.4} />
      </div>

      {/* L3 */}
      <div className="construct-grid" />
      <div className="construct-dust" />

      {/* L4 */}
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
