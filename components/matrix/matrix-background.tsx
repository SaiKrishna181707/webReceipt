'use client'

import dynamic from 'next/dynamic'

const MatrixRain = dynamic(() => import('./matrix-rain').then((m) => m.MatrixRain), { ssr: false })

const DRIFT = [
  { char: 'ﾊ', left: '7%', top: '18%', size: 92, delay: '0s', dur: '17s' },
  { char: '$', left: '88%', top: '26%', size: 64, delay: '2.4s', dur: '21s' },
  { char: 'ｷ', left: '72%', top: '72%', size: 116, delay: '5.1s', dur: '19s' },
  { char: '0', left: '17%', top: '78%', size: 72, delay: '7.6s', dur: '23s' },
]

export function MatrixBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,.55) 0%, #000 18%, #000 78%, rgba(0,0,0,.45) 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,.55) 0%, #000 18%, #000 78%, rgba(0,0,0,.45) 100%)',
        }}
      >
        <MatrixRain fontSize={16} opacity={0.416} />
      </div>

      <div className="construct-grid" />
      <div className="construct-dust" />

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
