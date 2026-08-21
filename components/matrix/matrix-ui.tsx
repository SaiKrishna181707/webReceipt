'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ScanOverlay } from './matrix-scan'
import { useScan } from './use-scan'

/* ============================================================================
   THE INTERFACE KIT

   Every control in the product is built from this file. The vocabulary is a
   terminal's, not a sign's: hairline edges, black faces, and light that arrives
   only on interaction.

   Six tones, and five of them are the same hue. `warn` and `alarm` exist purely
   so that a failing integrity check cannot be mistaken for a passing one.
   ========================================================================== */

const TONE = {
  /** Bright phosphor. Active, verified, primary. */
  matrix: {
    edge: 'rgba(51,255,102,.42)',
    edgeHot: 'rgba(51,255,102,.95)',
    line: '#33ff66',
    face: 'rgba(51,255,102,.07)',
    faceHot: 'rgba(51,255,102,.14)',
    solid: 'linear-gradient(180deg,#7bffa0 0%,#33ff66 52%,#00b83f 100%)',
    ink: '#e8ffee',
    solidInk: '#001a08',
  },
  /** Mid phosphor. Structure, labels, secondary panels. */
  phosphor: {
    edge: 'rgba(63,191,102,.4)',
    edgeHot: 'rgba(63,191,102,.9)',
    line: '#3fbf66',
    face: 'rgba(63,191,102,.06)',
    faceHot: 'rgba(63,191,102,.12)',
    solid: 'linear-gradient(180deg,#a5eab8 0%,#3fbf66 52%,#0b602b 100%)',
    ink: '#d3f7dd',
    solidInk: '#04240f',
  },
  /** Data teal. Evidence, hashes, information channels. */
  data: {
    edge: 'rgba(47,227,186,.4)',
    edgeHot: 'rgba(47,227,186,.9)',
    line: '#2fe3ba',
    face: 'rgba(47,227,186,.06)',
    faceHot: 'rgba(47,227,186,.12)',
    solid: 'linear-gradient(180deg,#aefde9 0%,#2fe3ba 52%,#00745c 100%)',
    ink: '#dbfff5',
    solidInk: '#00291f',
  },
  /** Amber CRT. Warnings only. */
  warn: {
    edge: 'rgba(204,187,69,.42)',
    edgeHot: 'rgba(204,187,69,.92)',
    line: '#ccbb45',
    face: 'rgba(204,187,69,.07)',
    faceHot: 'rgba(204,187,69,.13)',
    solid: 'linear-gradient(180deg,#f0e8ab 0%,#ccbb45 52%,#645818 100%)',
    ink: '#faf6d8',
    solidInk: '#241f09',
  },
  /** The one alarm colour. Integrity failures, rejected repairs. */
  alarm: {
    edge: 'rgba(255,77,77,.45)',
    edgeHot: 'rgba(255,77,77,.95)',
    line: '#ff4d4d',
    face: 'rgba(255,77,77,.07)',
    faceHot: 'rgba(255,77,77,.14)',
    solid: 'linear-gradient(180deg,#ffb3b3 0%,#ff4d4d 52%,#920f0f 100%)',
    ink: '#ffdcdc',
    solidInk: '#330606',
  },
  /** Unlit. Dismissals, tertiary controls, anything that should recede. */
  void: {
    edge: 'rgba(169,201,177,.22)',
    edgeHot: 'rgba(169,201,177,.5)',
    line: 'rgba(169,201,177,.55)',
    face: 'rgba(169,201,177,.04)',
    faceHot: 'rgba(169,201,177,.09)',
    solid: 'linear-gradient(180deg,#a9c9b1 0%,#4c6552 52%,#101a13 100%)',
    ink: '#a9c9b1',
    solidInk: '#000000',
  },
} as const

export type MatrixTone = keyof typeof TONE
export const matrixTones = TONE

const SIZES = {
  sm: 'h-9 px-4 text-[11px]',
  md: 'h-11 px-6 text-[12px]',
  lg: 'h-14 px-8 text-[13px]',
}

type ControlBase = {
  tone?: MatrixTone
  size?: keyof typeof SIZES
  /** `solid` powers the whole key. Use once per screen, at most. */
  variant?: 'outline' | 'solid' | 'ghost'
  className?: string
  children: React.ReactNode
}

function controlVars(tone: MatrixTone, variant: ControlBase['variant']) {
  const t = TONE[tone]
  return {
    ['--btn-edge' as string]: t.edge,
    ['--btn-edge-hot' as string]: t.edgeHot,
    ['--btn-face' as string]: t.face,
    ['--btn-face-hot' as string]: t.faceHot,
    ['--btn-solid' as string]: t.solid,
    ['--btn-solid-ink' as string]: t.solidInk,
    ['--btn-ink' as string]: variant === 'solid' ? t.solidInk : t.ink,
  } as React.CSSProperties
}

function controlClass(tone: MatrixTone, variant: ControlBase['variant'], size: keyof typeof SIZES, extra: string) {
  const modifier = variant === 'solid' ? 'sys-btn-solid' : variant === 'ghost' ? 'sys-btn-ghost' : ''
  return `sys-btn ${modifier} ${SIZES[size]} ${extra}`
}

/* -------------------------------------------------------------------------- */

/** A key on the console. The edge lights and a thin line crosses the face. */
export function SystemButton({
  tone = 'matrix',
  size = 'md',
  variant = 'outline',
  className = '',
  children,
  ...rest
}: ControlBase & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} style={controlVars(tone, variant)} className={controlClass(tone, variant, size, className)}>
      {children}
    </button>
  )
}

/**
 * The same key, as a route. `scan` runs the 620ms scan before navigating, which
 * is right for the hero CTAs and wrong for a back-link — so it's opt-in.
 */
export function SystemLink({
  tone = 'matrix',
  size = 'md',
  variant = 'outline',
  className = '',
  href,
  scan = false,
  tabIndex,
  children,
}: ControlBase & { href: string; scan?: boolean; tabIndex?: number }) {
  const router = useRouter()
  const { phase, run, hostProps } = useScan(() => router.push(href))

  if (!scan) {
    return (
      <Link
        href={href}
        tabIndex={tabIndex}
        style={controlVars(tone, variant)}
        className={controlClass(tone, variant, size, className)}
      >
        {children}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      tabIndex={tabIndex}
      {...hostProps}
      onClick={(e) => {
        // Let modified clicks (new tab, new window) through untouched.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        run()
      }}
      style={controlVars(tone, variant)}
      className={`${controlClass(tone, variant, size, className)} scan-host`}
    >
      <span className="relative z-[4] inline-flex items-center gap-2">{children}</span>
      <ScanOverlay phase={phase} />
    </Link>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * A panel bolted into the void: black glass, a lit power rail along the top
 * edge, and corner registration marks. `tilt` banks it very slightly toward the
 * pointer — enough to read as a floating surface, not enough to be a gimmick.
 */
export function MatrixPanel({
  tone = 'matrix',
  tilt = false,
  corner = true,
  rail = true,
  className = '',
  children,
  ...rest
}: {
  tone?: MatrixTone
  tilt?: boolean
  corner?: boolean
  rail?: boolean
  className?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.PointerEvent) => {
    if (!tilt || e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateZ(10px)`
  }

  const onLeave = () => {
    const el = ref.current
    if (el) el.style.transform = ''
  }

  const body = (
    <div
      {...rest}
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ ['--accent' as string]: TONE[tone].line, ['--deco-accent' as string]: TONE[tone].line }}
      className={`panel panel-lift ${rail ? 'panel-rail' : ''} ${corner ? 'panel-marks' : ''} ${
        tilt ? 'card-3d' : ''
      } ${className}`}
    >
      {children}
    </div>
  )

  return tilt ? <div className="scene-3d h-full">{body}</div> : body
}

/* -------------------------------------------------------------------------- */

/**
 * A clickable panel that runs a scan before it navigates. This is the
 * interaction from the brief: border illuminates → line sweeps → SCANNING /
 * VERIFYING / ACCESS GRANTED → route. 620ms end to end.
 */
export function SystemCard({
  href,
  tone = 'matrix',
  className = '',
  children,
}: {
  href: string
  tone?: MatrixTone
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const { phase, run, hostProps } = useScan(() => router.push(href))

  return (
    <Link
      href={href}
      {...hostProps}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        run()
      }}
      style={{ ['--accent' as string]: TONE[tone].line, ['--deco-accent' as string]: TONE[tone].line }}
      className={`scan-host panel panel-rail panel-marks panel-lift block overflow-hidden ${className}`}
    >
      {children}
      <ScanOverlay phase={phase} />
    </Link>
  )
}

/* -------------------------------------------------------------------------- */

/** A segmented data rail. Used as a rule, a divider, or a step track. */
export function SystemRail({
  count = 9,
  tone = 'matrix',
  className = '',
}: {
  count?: number
  tone?: MatrixTone
  className?: string
}) {
  const t = TONE[tone]
  return (
    <div className={`flex items-center gap-[3px] ${className}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="h-[2px]"
          style={{
            width: 8 + i * 1.2,
            background: t.line,
            boxShadow: `0 0 7px -2px ${t.edgeHot}`,
            opacity: 0.22 + (i / count) * 0.7,
          }}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** A live status readout: dot, label, value. The nav and every page header use it. */
export function SystemStatus({
  label,
  value,
  tone = 'matrix',
  live = true,
  className = '',
}: {
  label: string
  value: string
  tone?: MatrixTone
  live?: boolean
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] ${className}`}>
      <StatusDot tone={tone} live={live} />
      <span className="uppercase text-void-300">{label}</span>
      <span className="uppercase" style={{ color: TONE[tone].line }}>
        {value}
      </span>
    </span>
  )
}

export function StatusDot({ tone = 'matrix', live = false }: { tone?: MatrixTone; live?: boolean }) {
  return (
    <span
      aria-hidden
      className={`status-dot ${live ? 'status-dot-live' : ''}`}
      style={{ ['--dot' as string]: TONE[tone].line }}
    />
  )
}

/* -------------------------------------------------------------------------- */

/** The small monospaced caps that name every block in the system. */
export function Kicker({
  children,
  tone = 'phosphor',
  className = '',
}: {
  children: React.ReactNode
  tone?: MatrixTone
  className?: string
}) {
  return (
    <div
      className={`font-mono text-[10px] font-medium uppercase tracking-[0.28em] ${className}`}
      style={{ color: TONE[tone].line }}
    >
      {children}
    </div>
  )
}

/** Standard section header: kicker, rail, headline, one line of plain English. */
export function SectionHead({
  kicker,
  title,
  desc,
  tone = 'matrix',
  className = '',
}: {
  kicker: string
  title: React.ReactNode
  desc?: string
  tone?: MatrixTone
  className?: string
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <div className="flex items-center gap-3">
        <Kicker tone={tone}>{kicker}</Kicker>
        <SystemRail count={5} tone={tone} className="opacity-60" />
      </div>
      <h2 className="mt-3 text-[26px] font-bold leading-[1.12] text-void-100 sm:text-[32px]">{title}</h2>
      {desc && <p className="mt-3 text-[14.5px] leading-relaxed text-void-200">{desc}</p>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** Resolves children out of the code as they enter the viewport. */
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

/** A phosphor disc with code crawling through it. Decorative, used sparingly. */
export function DataDisc({ size = 120, className = '' }: { size?: number; className?: string }) {
  return <div className={`sun-disc ${className}`} style={{ width: size, height: size }} aria-hidden />
}
