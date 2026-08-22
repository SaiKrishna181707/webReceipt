'use client'

import { useEffect, useState } from 'react'

interface StrokeTextProps {
  text: string
  strokeColor?: string
  fillColor?: string
  strokeWidth?: number
  drawDuration?: number
  fillDelay?: number
  stagger?: number
  ease?: string
  trigger?: 'mount' | 'hover'
  fillMode?: 'wipe' | 'fade'
  fontSize?: number
  fontWeight?: number | string
  letterSpacing?: number
  className?: string
}

const EASINGS: Record<string, string> = {
  'power2.out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'power2.inOut': 'cubic-bezier(0.65, 0, 0.35, 1)',
  linear: 'linear',
}

export default function StrokeText({
  text,
  strokeColor = '#33ff66',
  fillColor = '#e8ffee',
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  stagger = 0.05,
  ease = 'power2.out',
  trigger = 'mount',
  fillMode = 'wipe',
  fontSize = 128,
  fontWeight = 800,
  letterSpacing = -4,
  className = '',
}: StrokeTextProps) {
  const [active, setActive] = useState(trigger === 'mount')
  const lines = text.split('\n')
  const lineHeight = Math.max(fontSize * 0.86, 72)
  const height = Math.max(360, lineHeight * lines.length + 30)
  const easing = EASINGS[ease] ?? EASINGS['power2.out']
  const fillDuration = Math.max(0.45, drawDuration * 0.55)
  const fillDelayTotal = drawDuration + fillDelay

  useEffect(() => {
    if (trigger !== 'mount') return
    const frame = requestAnimationFrame(() => setActive(true))
    return () => cancelAnimationFrame(frame)
  }, [trigger])

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      onMouseEnter={trigger === 'hover' ? () => setActive(true) : undefined}
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 1000 ${height}`}
        preserveAspectRatio="xMinYMid meet"
        aria-label={text.replace(/\n/g, ' ')}
        role="img"
        style={{
          ['--stroke-duration' as string]: `${drawDuration}s`,
          ['--fill-delay' as string]: `${fillDelayTotal}s`,
          ['--fill-duration' as string]: `${fillDuration}s`,
          ['--stroke-ease' as string]: easing,
        }}
      >
        <g
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          className={active ? 'stroke-draw-active' : ''}
        >
          {lines.map((line, index) => (
            <text
              key={`${line}-${index}`}
              x="0"
              y={fontSize + index * lineHeight}
              fontFamily="inherit"
              fontSize={fontSize}
              fontWeight={fontWeight}
              letterSpacing={letterSpacing}
              paintOrder="stroke"
              className="stroke-text-outline"
              style={{ animationDelay: `${index * stagger}s` }}
            >
              {line}
            </text>
          ))}
        </g>

        <g
          fill={fillColor}
          stroke="none"
          className={active ? 'stroke-fill-active' : ''}
        >
          {lines.map((line, index) => (
            <text
              key={`${line}-fill-${index}`}
              x="0"
              y={fontSize + index * lineHeight}
              fontFamily="inherit"
              fontSize={fontSize}
              fontWeight={fontWeight}
              letterSpacing={letterSpacing}
            >
              {line}
            </text>
          ))}
        </g>
      </svg>

      <style jsx>{`
        .stroke-text-outline {
          stroke-dasharray: 2400;
          stroke-dashoffset: 2400;
          opacity: 0.98;
        }

        .stroke-draw-active .stroke-text-outline {
          animation: strokeDraw var(--stroke-duration) var(--stroke-ease) forwards;
        }

        .stroke-fill-active {
          opacity: 0;
          clip-path: ${fillMode === 'wipe' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)'};
          animation: ${fillMode === 'wipe' ? 'strokeFillWipe' : 'strokeFillFade'} var(--fill-duration) var(--stroke-ease) var(--fill-delay) forwards;
        }

        @keyframes strokeDraw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes strokeFillWipe {
          0% { opacity: 0; clip-path: inset(0 100% 0 0); }
          18% { opacity: 1; }
          100% { opacity: 1; clip-path: inset(0 0 0 0); }
        }

        @keyframes strokeFillFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .stroke-text-outline {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
          .stroke-fill-active {
            animation: none !important;
            opacity: 1 !important;
            clip-path: none !important;
          }
        }
      `}</style>
    </div>
  )
}
