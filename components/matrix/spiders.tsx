'use client'

import { useEffect, useRef } from 'react'

type Spider = {
  x: number
  y: number
  angle: number
  turn: number
  speed: number
  scale: number
  pauseUntil: number
}

const COUNT = 6

function randomSpider(w: number, h: number): Spider {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    angle: Math.random() * Math.PI * 2,
    turn: 0,
    speed: 14 + Math.random() * 26,
    scale: 0.55 + Math.random() * 0.7,
    pauseUntil: 0,
  }
}

export function Spiders() {
  const nodes = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let w = window.innerWidth
    let h = window.innerHeight
    const spiders: Spider[] = Array.from({ length: COUNT }, () => randomSpider(w, h))

    const onResize = () => {
      w = window.innerWidth
      h = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      spiders.forEach((s, i) => {
        const node = nodes.current[i]
        if (!node) return
        const resting = now < s.pauseUntil
        if (!resting) {
          if (Math.random() > 0.985) s.turn = (Math.random() - 0.5) * 3.2
          if (Math.random() > 0.996) s.pauseUntil = now + 500 + Math.random() * 1600
          s.turn *= 0.94
          s.angle += s.turn * dt
          s.x += Math.cos(s.angle) * s.speed * dt
          s.y += Math.sin(s.angle) * s.speed * dt
          const m = 40
          if (s.x < -m) s.x = w + m
          if (s.x > w + m) s.x = -m
          if (s.y < -m) s.y = h + m
          if (s.y > h + m) s.y = -m
        }
        node.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.angle + Math.PI / 2}rad) scale(${s.scale})`
        node.style.setProperty('--leg-state', resting ? 'paused' : 'running')
      })
    }

    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      <style jsx>{`
        @keyframes wr-spider-step {
          0%, 100% { transform: rotate(-7deg); }
          50% { transform: rotate(7deg); }
        }
        .wr-spider-legs-a, .wr-spider-legs-b {
          transform-origin: 16px 17px;
          transform-box: fill-box;
          animation: wr-spider-step 0.26s ease-in-out infinite;
          animation-play-state: var(--leg-state, running);
        }
        .wr-spider-legs-b { animation-direction: reverse; }
        @media (prefers-reduced-motion: reduce) {
          .wr-spider-legs-a, .wr-spider-legs-b { animation: none; }
        }
      `}</style>
      {Array.from({ length: COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            nodes.current[i] = el
          }}
          className="absolute left-0 top-0 -ml-4 -mt-4 will-change-transform"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-[0.42]">
            <g stroke="#33ff66" strokeWidth="1.1" strokeLinecap="round" fill="none">
              <g className="wr-spider-legs-a">
                <path d="M15 14 L7 8 L3 11" />
                <path d="M15 16 L6 14 L2 17" />
                <path d="M15 18 L6 20 L3 24" />
                <path d="M15 20 L8 24 L6 28" />
              </g>
              <g className="wr-spider-legs-b">
                <path d="M17 14 L25 8 L29 11" />
                <path d="M17 16 L26 14 L30 17" />
                <path d="M17 18 L26 20 L29 24" />
                <path d="M17 20 L24 24 L26 28" />
              </g>
            </g>
            <ellipse cx="16" cy="19.5" rx="4.1" ry="5.4" fill="#050a06" stroke="#33ff66" strokeWidth="1.1" />
            <circle cx="16" cy="12.8" r="2.7" fill="#050a06" stroke="#33ff66" strokeWidth="1.1" />
          </svg>
        </div>
      ))}
    </div>
  )
}
