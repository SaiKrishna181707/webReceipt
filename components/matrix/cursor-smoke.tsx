'use client'

import { useEffect, useRef, useState } from 'react'

type SmokePuff = {
  id: number
  x: number
  y: number
  width: number
  height: number
  delay: number
  drift: number
  rotation: number
}

export function CursorSmoke() {
  const [active, setActive] = useState(false)
  const [puffs, setPuffs] = useState<SmokePuff[]>([])
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const idRef = useRef(0)
  const positionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const clearTimers = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = null
      if (spawnTimer.current) clearInterval(spawnTimer.current)
      spawnTimer.current = null
      setActive(false)
      setPuffs([])
    }

    const emit = () => {
      const { x, y } = positionRef.current
      const puff: SmokePuff = {
        id: idRef.current++,
        x: x + (Math.random() - 0.5) * 8,
        y: y + 4,
        width: 16 + Math.random() * 22,
        height: 38 + Math.random() * 48,
        delay: Math.random() * 100,
        drift: (Math.random() - 0.5) * 70,
        rotation: (Math.random() - 0.5) * 18,
      }
      setPuffs((current) => [...current.slice(-13), puff])
      window.setTimeout(() => {
        setPuffs((current) => current.filter((item) => item.id !== puff.id))
      }, 3800)
    }

    const startIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        setActive(true)
        emit()
        spawnTimer.current = setInterval(emit, 280)
      }, 3000)
    }

    const onPointerMove = (event: PointerEvent) => {
      positionRef.current = { x: event.clientX, y: event.clientY }
      clearTimers()
      startIdle()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    startIdle()

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (spawnTimer.current) clearInterval(spawnTimer.current)
    }
  }, [])

  if (!active && puffs.length === 0) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[20] overflow-hidden">
      <style jsx>{`
        @keyframes wr-smoke-rise {
          0% {
            opacity: 0;
            transform: translate3d(-50%, 0, 0) scaleX(0.55) scaleY(0.45) rotate(var(--rotation));
            filter: blur(7px);
          }
          18% {
            opacity: 0.42;
          }
          45% {
            opacity: 0.27;
          }
          100% {
            opacity: 0;
            transform: translate3d(calc(-50% + var(--drift)), -145px, 0) scaleX(1.8) scaleY(2.5) rotate(calc(var(--rotation) + 22deg));
            filter: blur(18px);
          }
        }
        .wr-smoke-puff {
          position: fixed;
          left: var(--x);
          top: var(--y);
          width: var(--width);
          height: var(--height);
          border-radius: 48% 52% 62% 38% / 55% 45% 55% 45%;
          background:
            radial-gradient(ellipse at 42% 72%, rgba(50, 255, 115, 0.30) 0%, rgba(35, 210, 90, 0.22) 30%, rgba(25, 145, 68, 0.12) 55%, transparent 78%);
          mix-blend-mode: screen;
          animation: wr-smoke-rise 3.6s ease-out forwards;
          animation-delay: var(--delay);
          will-change: transform, opacity, filter;
        }
      `}</style>
      {puffs.map((puff) => (
        <span
          key={puff.id}
          className="wr-smoke-puff"
          style={
            {
              '--x': `${puff.x}px`,
              '--y': `${puff.y}px`,
              '--width': `${puff.width}px`,
              '--height': `${puff.height}px`,
              '--delay': `${puff.delay}ms`,
              '--drift': `${puff.drift}px`,
              '--rotation': `${puff.rotation}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
