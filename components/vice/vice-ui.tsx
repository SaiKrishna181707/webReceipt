'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ============================================================================
   VICE UI KIT (CSS)
   The WebGL scenes carry the skyline; these carry the interface. Every control
   is a lit sign: a bent glass tube for the border, a dim gel behind it, and a
   halo that spills onto whatever it's bolted to.
   ========================================================================== */

const TONE = {
  neon: {
    tube: '#ff2e97',
    glow: 'rgba(255,46,151,.7)',
    face: 'linear-gradient(180deg,rgba(255,46,151,.26),rgba(255,46,151,.04))',
    solid: 'linear-gradient(180deg,#ff7cbd 0%,#ff2e97 50%,#c40c74 100%)',
    ink: '#fff',
    solidInk: '#180014',
  },
  aqua: {
    tube: '#2de2e6',
    glow: 'rgba(45,226,230,.7)',
    face: 'linear-gradient(180deg,rgba(45,226,230,.24),rgba(45,226,230,.04))',
    solid: 'linear-gradient(180deg,#8ff6f9 0%,#2de2e6 50%,#00939b 100%)',
    ink: '#eafeff',
    solidInk: '#00201f',
  },
  gold: {
    tube: '#ffc23c',
    glow: 'rgba(255,194,60,.7)',
    face: 'linear-gradient(180deg,rgba(255,194,60,.24),rgba(255,194,60,.04))',
    solid: 'linear-gradient(180deg,#ffe6a3 0%,#ffc23c 50%,#d18d00 100%)',
    ink: '#fff6e0',
    solidInk: '#241500',
  },
  mint: {
    tube: '#35f39a',
    glow: 'rgba(53,243,154,.68)',
    face: 'linear-gradient(180deg,rgba(53,243,154,.22),rgba(53,243,154,.04))',
    solid: 'linear-gradient(180deg,#a8ffd2 0%,#35f39a 50%,#04a45f 100%)',
    ink: '#e9fff4',
    solidInk: '#00220f',
  },
  blood: {
    tube: '#ff2d5e',
    glow: 'rgba(255,45,94,.7)',
    face: 'linear-gradient(180deg,rgba(255,45,94,.24),rgba(255,45,94,.04))',
    solid: 'linear-gradient(180deg,#ff8098 0%,#ff2d5e 50%,#bb0433 100%)',
    ink: '#fff',
    solidInk: '#21000a',
  },
  violet: {
    tube: '#b184ff',
    glow: 'rgba(138,77,255,.6)',
    face: 'linear-gradient(180deg,rgba(138,77,255,.24),rgba(138,77,255,.04))',
    solid: 'linear-gradient(180deg,#d5b8ff 0%,#8b4dff 50%,#4c14a0 100%)',
    ink: '#f3ecff',
    solidInk: '#150033',
  },
  chrome: {
    tube: 'rgba(255,255,255,.42)',
    glow: 'rgba(255,255,255,.34)',
    face: 'linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.02))',
    solid: 'linear-gradient(180deg,#ffffff 0%,#c9c2e0 46%,#7d759c 100%)',
    ink: '#f6f3ff',
    solidInk: '#0a0510',
  },
} as const

export type ViceTone = keyof typeof TONE

export const viceTones = TONE

/* -------------------------------------------------------------------------- */

const SIZES = {
  sm: 'h-9 px-4 text-[12px]',
  md: 'h-11 px-6 text-[13px]',
  lg: 'h-14 px-8 text-[15px]',
}

type ControlBase = {
  tone?: ViceTone
  size?: keyof typeof SIZES
  /** `solid` lights the whole face; the default only lights the tube. */
  variant?: 'outline' | 'solid'
  className?: string
  children: React.ReactNode
}

function controlStyle(tone: ViceTone, variant: 'outline' | 'solid') {
  const t = TONE[tone]
  return {
    ['--btn-tube' as string]: t.tube,
    ['--btn-glow' as string]: t.glow,
    ['--btn-face' as string]: t.face,
    ['--btn-solid' as string]: t.solid,
    ['--btn-ink' as string]: variant === 'solid' ? t.solidInk : t.ink,
  } as React.CSSProperties
}

/** A lit sign you can press. The tube dims and the sign sinks into its bracket. */
export function NeonButton({
  tone = 'neon',
  size = 'md',
  variant = 'outline',
  className = '',
  children,
  ...rest
}: ControlBase & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={controlStyle(tone, variant)}
      className={`neon-btn ${variant === 'solid' ? 'neon-btn-solid' : ''} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  )
}

/** The same sign, as a link. */
export function NeonLink({
  tone = 'neon',
  size = 'md',
  variant = 'outline',
  className = '',
  href,
  children,
}: ControlBase & { href: string }) {
  return (
    <Link
      href={href}
      style={controlStyle(tone, variant)}
      className={`neon-btn ${variant === 'solid' ? 'neon-btn-solid' : ''} ${SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * An Art Deco facade. Tracks the pointer and banks on two axes, so the neon
 * parapet and the sheen travel across the front as you move over it.
 */
export function DecoPanel({
  tone = 'neon',
  tilt = true,
  corner = true,
  className = '',
  children,
}: {
  tone?: ViceTone
  tilt?: boolean
  corner?: boolean
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
    el.style.transform = `rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateZ(14px)`
  }

  const onLeave = () => {
    const el = ref.current
    if (el) el.style.transform = ''
  }

  return (
    <div className={tilt ? 'scene-3d h-full' : 'h-full'}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ ['--deco-accent' as string]: TONE[tone].tube }}
        className={`deco-panel deco-lift card-3d ${corner ? 'deco-corner' : ''} ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** A run of tube segments — used as a rule, a divider, or a step track. */
export function TubeRail({
  count = 9,
  tone = 'neon',
  className = '',
}: {
  count?: number
  tone?: ViceTone
  className?: string
}) {
  const t = TONE[tone]
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="h-[3px] rounded-full"
          style={{
            width: 10 + i * 1.5,
            background: t.tube,
            boxShadow: `0 0 8px -1px ${t.glow}`,
            opacity: 0.28 + (i / count) * 0.72,
          }}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** Reveals children as they enter the viewport, rising out of the dusk haze. */
export function Reveal({
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

/** The banded sun, sized to taste. Bars crawl upward as it sets. */
export function SunDisc({ size = 120, className = '' }: { size?: number; className?: string }) {
  return <div className={`sun-disc ${className}`} style={{ width: size, height: size }} aria-hidden />
}

/* -------------------------------------------------------------------------- */

/* Neon glyphs for the boulevard ticker. Drawn here rather than shipped as
   images so they inherit the tube colour and stay crisp at any size. */

const GLYPHS: Record<string, string> = {
  palm:
    'M12 22V11M12 11c0-3-3-5-6-4.5 2-2 5-2 6 .5 1-2.5 4-2.5 6-.5-3-.5-6 1.5-6 4.5ZM12 11C10 8 6 7.5 3.5 9.5 6 8.5 9.5 9 12 11Zm0 0c2-3 6-3.5 8.5-1.5C18 8.5 14.5 9 12 11Z',
  flamingo: 'M9 22h7M12.5 22V14c0-2 1-3 3-3.5M15.5 10.5c2 0 3.5-1.5 3.5-3.5S17.5 3 15.5 4c-1 .5-1.5 1.5-1.5 2.5M13 6.5H10',
  car: 'M2.5 15.5h19M4 15.5l1.5-4.5c.3-1 1.2-1.5 2.2-1.5h8.6c1 0 1.9.5 2.2 1.5l1.5 4.5M6 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm12 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  cocktail: 'M12 21v-6M8 21h8M4 5h16l-8 10L4 5Z',
  cassette: 'M3 6h18v12H3V6Zm4 5h10v3H7v-3Z',
  sun: 'M12 4v3m0 10v3M4 12h3m10 0h3M6.3 6.3l2.1 2.1m7.3 7.3 2.1 2.1m0-11.5-2.1 2.1M8.4 15.6l-2.1 2.1M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
}

const TICKER: [string, ViceTone, string][] = [
  ['palm', 'mint', 'Ocean Drive'],
  ['car', 'aqua', 'Cruise'],
  ['sun', 'gold', 'Dusk 19:04'],
  ['flamingo', 'neon', 'Vice Beach'],
  ['cassette', 'violet', 'Side A'],
  ['cocktail', 'gold', 'Happy Hour'],
  ['palm', 'aqua', 'Palm & 8th'],
  ['car', 'neon', 'Top Down'],
]

/** Endless boulevard ticker: lit signs sliding past like storefronts. */
export function BoulevardTicker() {
  const row = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center gap-3 pr-3">
      {TICKER.map(([glyph, tone, label], i) => {
        const t = TONE[tone]
        return (
          <span
            key={`${keyPrefix}-${i}`}
            className="inline-flex items-center gap-2 rounded-[2px] border px-3 py-1.5"
            style={{
              borderColor: t.tube,
              background: t.face,
              boxShadow: `inset 0 -8px 18px -12px ${t.tube}, 0 0 14px -6px ${t.glow}`,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d={GLYPHS[glyph]}
                stroke={t.tube}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 4px ${t.glow})` }}
              />
            </svg>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.22em]"
              style={{ color: t.ink, textShadow: `0 0 10px ${t.glow}` }}
            >
              {label}
            </span>
          </span>
        )
      })}
    </div>
  )

  return (
    <div className="relative flex overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
      <div className="flex animate-marquee" style={{ ['--duration' as string]: '42s', ['--gap' as string]: '0.75rem' }}>
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
