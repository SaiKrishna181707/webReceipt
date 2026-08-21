'use client'

import { useEffect, useRef, useState } from 'react'

type SmokePuff = {
  id: number
  x: number
  y: number
  size: number
  delay: number
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

    const clearIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = null
      setActive(false)
      if (spawnTimer.current) clearInterval(spawnTimer.current)
      spawnTimer.current = null
    }

    const emit = () => {
      const { x, y } = positionRef.current
      const puff: SmokePuff = {
        id: idRef.current++,
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 8,
        size: 18 + Math.random() * 28,
        delay: Math.random() * 180,
      }
      setPuffs((current) => [...current.slice(-7), puff])
      window.setTimeout(() => {
        setPuffs((current) => current.filter((item) => item.id !== puff.id))
      }, 2600)
    }

    const startIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        setActive(true)
        emit()
        spawnTimer.current = setInterval(emit, 420)
      }, 2000)
    }

    const onPointerMove = (event: PointerEvent) => {
      positionRef.current = { x: event.clientX, y: event.clientY }
      setPosition(positionRef.current)
      clearIdle()
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
            transform: translate3d(-50%, -10%, 0) scale(0.45) rotate(0deg);
            filter: blur(5px);
          }
          18% { opacity: 0.2; }
          100% {
            opacity: 0;
            transform: translate3d(calc(-50% + var(--drift)), -95px, 0) scale(1.65) rotate(18deg);
            filter: blur(12px);
          }
        }
        .wr-smoke-puff {
          position: fixed;
          left: var(--x);
          top: var(--y);
          width: var(--size);
          height: var(--size);
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(184, 210, 191, 0.22) 0%, rgba(111, 143, 119, 0.11) 42%, transparent 72%);
          box-shadow: 0 0 22px rgba(133, 168, 141, 0.1);
          animation: wr-smoke-rise 2.35s ease-out forwards;
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
              '--drift': `${(Math.random() - 0.5) * 45}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <span
        className="absolute rounded-full bg-white/5 blur-xl"
        style={{ left: position.x - 14, top: position.y - 14, width: 28, height: 28 }}
      />
    </div>
  )
}
