'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from './use-reduced-motion'

/* ============================================================================
   THE CRAWLERS

   A few arachnids patrolling the viewport, well behind the interface. One RAF
   loop drives all of them by writing `transform` directly — no React state, so a
   crawl step never costs a render.

   Three, not six, and at `z-[2]` rather than `z-[5]`: they now share the screen
   with the tunnel, and a cloud of them over a moving shader read as dirt on the
   lens rather than life in the system.

   Their leg classes are `wr-crawler-*`, deliberately not the `wr-spider-*` names
   in `globals.css`. Those belong to `logo-spider.tsx`, which has a different gait
   (a translate/scale bob about `12px 12px`); this one rotates about `16px 17px`.
   Two different animations under one name is a trap even when styled-jsx scoping
   happens to keep them apart.
   ========================================================================== */

type Crawler = {
  x: number
  y: number
  angle: number
  turn: number
  speed: number
  scale: number
  pauseUntil: number
}

const COUNT = 3

function randomCrawler(w: number, h: number): Crawler {
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
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return

    let w = window.innerWidth
    let h = window.innerHeight
    const crawlers: Crawler[] = Array.from({ length: COUNT }, () => randomCrawler(w, h))

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

      crawlers.forEach((s, i) => {
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

    const start = () => {
      if (raf === 0) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    const stop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    start()
    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [reduced])

  /* Under reduced motion there is no loop to place them, so without this they
     would render stacked in the top-left corner at their untransformed origin. */
  if (reduced) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
      <style jsx>{`
        @keyframes wr-crawler-step {
          0%,
          100% {
            transform: rotate(-7deg);
          }
          50% {
            transform: rotate(7deg);
          }
        }
        .wr-crawler-legs-a,
        .wr-crawler-legs-b {
          transform-origin: 16px 17px;
          transform-box: fill-box;
          animation: wr-crawler-step 0.26s ease-in-out infinite;
          animation-play-state: var(--leg-state, running);
        }
        .wr-crawler-legs-b {
          animation-direction: reverse;
        }
        @media (prefers-reduced-motion: reduce) {
          .wr-crawler-legs-a,
          .wr-crawler-legs-b {
            animation: none;
          }
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
              <g className="wr-crawler-legs-a">
                <path d="M15 14 L7 8 L3 11" />
                <path d="M15 16 L6 14 L2 17" />
                <path d="M15 18 L6 20 L3 24" />
                <path d="M15 20 L8 24 L6 28" />
              </g>
              <g className="wr-crawler-legs-b">
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
