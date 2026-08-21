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
        x: x + (Math.random() - 0.5) * 5,
        y: y + 2,
        width: 7 + Math.random() * 9,
        height: 65 + Math.random() * 65,
        delay: Math.random() * 80,
        drift: (Math.random() - 0.5) * 85,
        rotation: (Math.random() - 0.5) * 24,
      }
      setPuffs((current) => [...current.slice(-17), puff])
      window.setTimeout(() => {
        setPuffs((current) => current.filter((item) => item.id !== puff.id))
      }, 3900)
    }

    const startIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        setActive(true)
        emit()
        spawnTimer.current = setInterval(emit, 260)
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
            transform: translate3d(-50%, 8px, 0) scaleX(0.45) scaleY(0.25) rotate(var(--rotation));
            filter: blur(9px);
          }
          14% {
            opacity: 0.52;
          }
          42% {
            opacity: 0.34;
          }
          72% {
            opacity: 0.18;
          }
          100% {
            opacity: 0;
            transform: translate3d(calc(-50% + var(--drift)), -155px, 0) scaleX(2.1) scaleY(1.9) rotate(calc(var(--rotation) + 28deg));
            filter: blur(20px);
          }
        }

        .wr-smoke-puff {
          position: fixed;
          left: var(--x);
          top: var(--y);
          width: var(--width);
          height: var(--height);
          border-radius: 80% 20% 70% 30% / 25% 70% 30% 75%;
          background: linear-gradient(
            180deg,
            rgba(35, 255, 105, 0.02) 0%,
            rgba(45, 235, 105, 0.38) 24%,
            rgba(35, 205, 85, 0.24) 52%,
            rgba(25, 145, 65, 0.10) 78%,
            transparent 100%
          );
          box-shadow:
            -8px 18px 18px rgba(40, 255, 105, 0.08),
            7px 35px 24px rgba(35, 210, 90, 0.07);
          mix-blend-mode: screen;
          animation: wr-smoke-rise 3.9s ease-out forwards;
          animation-delay: var(--delay);
          will-change: transform, opacity, filter;
        }

        .wr-smoke-puff::before,
        .wr-smoke-puff::after {
          content: '';
          position: absolute;
          pointer-events: none;
          left: 50%;
          bottom: 8%;
          width: 65%;
          height: 52%;
          transform: translateX(-50%) rotate(-18deg);
          border-radius: 70% 30% 65% 35%;
          background: linear-gradient(
            180deg,
            rgba(50, 255, 115, 0.24),
            rgba(30, 190, 75, 0.12) 55%,
            transparent
          );
          filter: blur(11px);
        }

        .wr-smoke-puff::after {
          left: 70%;
          bottom: 28%;
          width: 48%;
          height: 42%;
          transform: translateX(-50%) rotate(26deg);
          opacity: 0.65;
          filter: blur(14px);
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
