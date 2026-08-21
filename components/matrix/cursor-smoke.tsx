'use client'

import { useEffect, useRef, useState } from 'react'

type SmokePuff = {
  id: number
  x: number
  y: number
  size: number
  delay: number
  drift: number
}

export function CursorSmoke() {
  const [active, setActive] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [puffs, setPuffs] = useState<SmokePuff[]>([])
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const idRef = useRef(0)
  const positionRef = useRef(position)

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
        x: x + (Math.random() - 0.5) * 12,
        y: y + 2 + Math.random() * 8,
        size: 26 + Math.random() * 42,
        delay: Math.random() * 120,
        drift: (Math.random() - 0.5) * 55,
      }
      setPuffs((current) => [...current.slice(-11), puff])
      window.setTimeout(() => {
        setPuffs((current) => current.filter((item) => item.id !== puff.id))
      }, 3600)
    }

    const startIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        setActive(true)
        emit()
        spawnTimer.current = setInterval(emit, 300)
      }, 3000)
    }

    const onPointerMove = (event: PointerEvent) => {
      positionRef.current = { x: event.clientX, y: event.clientY }
      setPosition(positionRef.current)
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
            transform: translate3d(-50%, -5%, 0) scale(0.3) rotate(0deg);
            filter: blur(6px);
          }
          12% {
            opacity: 0.18;
          }
          42% {
            opacity: 0.12;
          }
          100% {
            opacity: 0;
            transform: translate3d(calc(-50% + var(--drift)), -125px, 0) scale(2.15) rotate(24deg);
            filter: blur(16px);
          }
        }
        .wr-smoke-puff {
          position: fixed;
          left: var(--x);
          top: var(--y);
          width: var(--size);
          height: var(--size);
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(205, 220, 208, 0.20) 0%, rgba(128, 151, 134, 0.13) 32%, rgba(91, 116, 98, 0.07) 52%, transparent 76%);
          box-shadow: 0 0 28px rgba(145, 170, 151, 0.12);
          animation: wr-smoke-rise 3.25s ease-out forwards;
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
              '--size': `${puff.size}px`,
              '--delay': `${puff.delay}ms`,
              '--drift': `${puff.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
