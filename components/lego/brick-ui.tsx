'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ============================================================================
   BRICK UI KIT (CSS)
   The WebGL scenes carry the spectacle; these carry the interface. Every
   control is a moulded part: studs on top, a bevelled top edge, a dark
   underside, and a clutch shadow that collapses when you press it.
   ========================================================================== */

const TONE = {
  red: { face: 'linear-gradient(180deg,#ff5a63 0%,#e3000b 44%,#b40009 100%)', edge: '#7c0006', stud: '#ff8f95', text: '#fff' },
  yellow: { face: 'linear-gradient(180deg,#ffe266 0%,#f6c500 46%,#c99f00 100%)', edge: '#8f7000', stud: '#fff0a8', text: '#1b1b1b' },
  blue: { face: 'linear-gradient(180deg,#2f93ef 0%,#0057a8 46%,#003f7d 100%)', edge: '#002c58', stud: '#7dc0ff', text: '#fff' },
  green: { face: 'linear-gradient(180deg,#3ec163 0%,#00852b 46%,#006320 100%)', edge: '#004517', stud: '#8de5a5', text: '#fff' },
  orange: { face: 'linear-gradient(180deg,#ffa85c 0%,#ff6a13 46%,#cc4f08 100%)', edge: '#8f3705', stud: '#ffc79b', text: '#1b1b1b' },
  grey: { face: 'linear-gradient(180deg,#8b8e86 0%,#6c6e68 46%,#4d4f4a 100%)', edge: '#33352f', stud: '#adafa7', text: '#fff' },
  slate: { face: 'linear-gradient(180deg,#3a3c36 0%,#2a2b25 46%,#1d1e19 100%)', edge: '#111208', stud: '#55574f', text: '#f6f7f3' },
  white: { face: 'linear-gradient(180deg,#ffffff 0%,#eceee7 46%,#c9cbc3 100%)', edge: '#a2a49c', stud: '#ffffff', text: '#1b1b1b' },
} as const

export type BrickTone = keyof typeof TONE

export const brickTones = TONE

/* -------------------------------------------------------------------------- */

type ButtonBase = {
  tone?: BrickTone
  size?: 'sm' | 'md' | 'lg'
  studs?: boolean
  className?: string
  children: React.ReactNode
}

const SIZES = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-14 px-8 text-base',
}

function brickStyle(tone: BrickTone) {
  const t = TONE[tone]
  return {
    background: t.face,
    color: t.text,
    ['--brick-btn-edge' as string]: t.edge,
    ['--stud-color' as string]: t.stud,
  } as React.CSSProperties
}

/** A brick you can click. Presses 5px into the plate and the shadow collapses. */
export function BrickButton({
  tone = 'red',
  size = 'md',
  studs = true,
  className = '',
  children,
  ...rest
}: ButtonBase & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={brickStyle(tone)}
      className={`brick-btn ${studs ? 'brick-btn-studs' : ''} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  )
}

/** The same part, as a link. */
export function BrickLink({
  tone = 'red',
  size = 'md',
  studs = true,
  className = '',
  href,
  children,
}: ButtonBase & { href: string }) {
  return (
    <Link href={href} style={brickStyle(tone)} className={`brick-btn ${studs ? 'brick-btn-studs' : ''} ${SIZES[size]} ${className}`}>
      {children}
    </Link>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * A card moulded as a single brick. Tracks the pointer and tilts on two axes in
 * real perspective, so the highlight travels across the top face.
 */
export function BrickPanel({
  tone = 'slate',
  studs = true,
  tilt = true,
  className = '',
  children,
}: {
  tone?: BrickTone
  studs?: boolean
  tilt?: boolean
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.PointerEvent) => {
    if (!tilt) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `rotateY(${px * 11}deg) rotateX(${-py * 11}deg) translateZ(18px)`
    el.style.setProperty('--sheen-x', `${(px + 0.5) * 100}%`)
  }

  const onLeave = () => {
    const el = ref.current
    if (el) el.style.transform = ''
  }

  const t = TONE[tone]

  return (
    <div className={tilt ? 'scene-3d' : ''}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ background: t.face, color: t.text, ['--stud-color' as string]: t.stud }}
        className={`brick-card brick-3d ${studs ? 'brick-card-studs' : ''} ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** A 1xN row of studs — used as a rule, a divider, or a progress track. */
export function StudRail({ count = 8, tone = 'yellow', className = '' }: { count?: number; tone?: BrickTone; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: TONE[tone].stud,
            boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.35), 0 1px 0 rgba(0,0,0,.5)',
            opacity: 0.35 + (i / count) * 0.65,
          }}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** Reveals children as they enter the viewport, dropping in like placed bricks. */
export function BrickReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '-8% 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
      style={{ ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** Infinite conveyor of loose parts. Pure CSS, doubled for a seamless loop. */
export function PartsConveyor() {
  const parts: [BrickTone, number][] = [
    ['red', 4],
    ['yellow', 2],
    ['blue', 3],
    ['white', 2],
    ['green', 4],
    ['orange', 2],
    ['grey', 3],
    ['yellow', 4],
    ['blue', 2],
    ['red', 3],
  ]

  const row = (keyPrefix: string) => (
    <div className="flex shrink-0 items-end gap-4 pr-4">
      {parts.map(([tone, w], i) => (
        <span
          key={`${keyPrefix}-${i}`}
          className="relative rounded-[4px]"
          style={{
            width: w * 17,
            height: 26,
            background: TONE[tone].face,
            boxShadow: `inset 0 2px 0 rgba(255,255,255,.4), inset 0 -3px 0 rgba(0,0,0,.35), 0 4px 0 -1px ${TONE[tone].edge}`,
          }}
        >
          <span
            className="absolute -top-[5px] left-1.5 h-[10px]"
            style={{
              width: w * 17 - 12,
              backgroundImage: `radial-gradient(ellipse 7px 5px at 8px 55%, ${TONE[tone].stud} 0 62%, transparent 64%)`,
              backgroundSize: '17px 10px',
              backgroundRepeat: 'repeat-x',
            }}
          />
        </span>
      ))}
    </div>
  )

  return (
    <div className="relative flex overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex animate-marquee" style={{ ['--duration' as string]: '38s', ['--gap' as string]: '1rem' }}>
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
