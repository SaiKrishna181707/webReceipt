'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GuidePortrait } from './guide-portrait'
import { WebReceiptLogo } from '@/components/brand/webreceipt-logo'

/* ============================================================================
   OPENING SEQUENCE

   Black → a figure resolves in the dark → a scan passes over him → the code
   environment comes up → the interface loads. 3.4 seconds, once per session,
   skippable at any point with the button or Escape.

   The short runtime is the point. A cinematic that plays on every navigation
   stops being cinematic and becomes a toll, so this checks sessionStorage
   before it ever renders, and never runs at all under reduced motion.
   ========================================================================== */

const SESSION_KEY = 'wr.intro.v1'

/** Cue sheet, in ms from the first frame. */
const CUE = {
  figure: 280,
  scan: 980,
  print: 1160,
  ready: 2550,
  lift: 3500,
  end: 4450,
} as const

const BOOT_LINES = [
  'Every problem has a solution.',
  'You just have to be smart enough',
  'to find it.',
]

export function BootIntro() {
  /** `null` until we've checked the session — nothing renders before that. */
  const [active, setActive] = useState<boolean | null>(null)
  const [cue, setCue] = useState<'black' | 'figure' | 'scan' | 'ready' | 'lift'>('black')
  const [printed, setPrinted] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  /** Decided once per mount. StrictMode runs the effect below twice, and the
      second pass must not read the session flag the first pass just wrote —
      that self-cancels the sequence and it never plays in development. */
  const shouldPlay = useRef<boolean | null>(null)

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    shouldPlay.current = false
    setActive(false)
    document.body.style.overflow = ''
    window.dispatchEvent(new Event('wr:intro-done'))
  }, [])

  useEffect(() => {
    if (shouldPlay.current === null) {
      const seen = sessionStorage.getItem(SESSION_KEY) === '1'
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      shouldPlay.current = !seen && !reduced
      if (shouldPlay.current) sessionStorage.setItem(SESSION_KEY, '1')
    }

    if (!shouldPlay.current) {
      setActive(false)
      // Anything waiting on the sequence still gets its cue.
      window.dispatchEvent(new Event('wr:intro-done'))
      return
    }

    setActive(true)
    setCue('black')
    setPrinted(0)
    document.body.style.overflow = 'hidden'

    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms))
    at(CUE.figure, () => setCue('figure'))
    at(CUE.scan, () => setCue('scan'))
    BOOT_LINES.forEach((_, i) => at(CUE.print + i * 250, () => setPrinted(i + 1)))
    at(CUE.ready, () => setCue('ready'))
    at(CUE.lift, () => setCue('lift'))
    at(CUE.end, finish)

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
      document.body.style.overflow = ''
    }
  }, [finish])

  // Escape skips. Anyone who reaches for it has already decided.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, finish])

  if (!active) return null

  const lifting = cue === 'lift'
  const ready = cue === 'ready' || lifting

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Opening sequence"
      onClick={ready ? finish : undefined}
      className="fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-[900ms] ease-out"
      style={{
        // The black lifts rather than cutting, so the code behind bleeds through.
        background: lifting ? 'rgba(0,0,0,0.35)' : '#000',
        opacity: lifting ? 0 : 1,
        transitionProperty: 'opacity, background-color',
      }}
    >
      <div className="relative flex h-full w-full items-end px-6 pb-20 sm:items-center sm:px-10 sm:pb-0 lg:px-16">
        <div className="flex w-full max-w-6xl flex-col items-center gap-7 sm:flex-row sm:items-center sm:gap-12 lg:gap-20">
          {/* The figure. Fades up out of the dark and breathes very slightly —
              the only movement in the frame for the first second. */}
          <div
            className="relative w-[min(52vw,340px)] shrink-0 transition-all duration-[1200ms] ease-out sm:w-[min(37vw,380px)]"
            style={{
              opacity: cue === 'black' ? 0 : 1,
              transform: cue === 'black' ? 'translateY(10px) scale(0.985)' : 'none',
            }}
          >
            <GuidePortrait
              size={380}
              fullFigure
              cinematic={cue === 'scan'}
              className="!h-auto !w-full aspect-[2/3] animate-float border-0 bg-transparent shadow-[0_0_55px_-30px_rgba(51,255,102,.8)]"
            />
          </div>

          {/* The boot log, printing beside him. */}
          <div className="min-w-0 max-w-xl flex-1 self-center sm:pb-10">
            <div
              className="transition-opacity duration-700"
              style={{ opacity: cue === 'black' ? 0 : 1 }}
            >
              <WebReceiptLogo size={22} />
            </div>

            <div className="terminal terminal-phosphor mt-5 max-w-xl">
              <div className="terminal-bar">
                <span className="status-dot status-dot-live" style={{ ['--dot' as string]: '#33ff66' }} aria-hidden />
                <span className="sys-label flex-1">Secure channel</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-matrix-400">live</span>
              </div>
              <div className="relative z-[1] space-y-2 px-5 py-5">
              {BOOT_LINES.slice(0, printed).map((line, i) => (
                <p
                  key={line}
                  className={`sys-prompt animate-fade-in-up font-mono text-[11.5px] uppercase tracking-[0.16em] ${
                    i === BOOT_LINES.length - 1 ? 'text-matrix-300' : 'text-void-200'
                  } ${i === printed - 1 ? 'caret' : ''}`}
                >
                  {line}
                </p>
              ))}
              </div>
            </div>

            <p
              className="mt-6 font-mono text-[10px] uppercase tracking-[0.34em] text-matrix-400 transition-opacity duration-500"
              style={{ opacity: ready ? 1 : 0 }}
            >
              Click anywhere to enter
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            finish()
          }}
          className="sys-btn sys-btn-ghost absolute bottom-8 right-6 h-9 px-4 text-[11px]"
        >
          Skip
        </button>

        <span className="absolute bottom-9 left-6 font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
          Press esc to skip
        </span>
      </div>
    </div>
  )
}
