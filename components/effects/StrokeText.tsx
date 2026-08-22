'use client'

import { useEffect, useId, useState } from 'react'

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
  const id = useId().replace(/:/g, '')
  const [active, setActive] = useState(trigger === 'mount')

  useEffect(() => {
    if (trigger === 'mount') {
      const frame = requestAnimationFrame(() => setActive(true))
      return () => cancelAnimationFrame(frame)
    }
  }, [trigger])

  const lines = text.split('\n')
  const lineHeight = Math.max(fontSize * 0.86, 72)
  const height = Math.max(360, lineHeight * lines.length + 30)
  const easing = EASINGS[ease] ?? EASINGS['power2.out']

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${trigger === 'hover' ? 'group' : ''} ${className}`}
      onMouseEnter={trigger === 'hover' ? () => setActive(true) : undefined}
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 1000 ${height}`}
        preserveAspectRatio="xMinYMid meet"
        aria-label={text.replace(/\n/g, ' ')}
        role="img"
      >
        <defs>
          <clipPath id={`wipe-${id}`}>
            <rect
              className="stroke-fill-wipe"
              x="0"
              y="0"
              width="1000"
              height={height}
            />
          </clipPath>
        </defs>

        <g
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          className={active ? 'stroke-draw-active' : ''}
          style={{
            ['--stroke-duration' as string]: `${drawDuration}s`,
            ['--stroke-ease' as string]: easing,
          }}
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
          clipPath={fillMode === 'wipe' ? `url(#wipe-${id})` : undefined}
          className={active ? 'stroke-fill-active' : ''}
          style={{
            ['--fill-delay' as string]: `${drawDuration + fillDelay}s`,
            ['--fill-duration' as string]: `${Math.max(0.45, drawDuration * 0.55)}s`,
            ['--stroke-ease' as string]: easing,
          }}
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
          transform-origin: left center;
          animation:
            ${fillMode === 'wipe' ? 'strokeFillReveal' : 'strokeFillFade'}
            var(--fill-duration)
            var(--stroke-ease)
            var(--fill-delay)
            forwards;
        }

        .stroke-fill-wipe {
          transform: scaleX(0);
          transform-origin: left center;
          animation: strokeWipe var(--fill-duration) var(--stroke-ease) var(--fill-delay) forwards;
        }

        @keyframes strokeDraw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes strokeFillReveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes strokeFillFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes strokeWipe {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .stroke-text-outline {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
          .stroke-fill-wipe {
            animation: none !important;
            transform: scaleX(1) !important;
          }
          .stroke-fill-active {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  )
}
