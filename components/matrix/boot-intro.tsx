'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MatrixRain } from './matrix-rain'
import { useReducedMotion } from './use-reduced-motion'

const PORTRAIT = '/scofield.png'
const FALLBACK = '/webreceipt-mark.svg'
const EASE = 'cubic-bezier(0.23,1,0.32,1)'
const EXIT_MS = 460
const SEEN_KEY = 'wr:intro-seen'

/** `open` holds the viewport, `leaving` runs the exit transition, `done` returns
 *  `null`. The third one matters: without it the overlay stays in the tree as a
 *  `role="dialog" aria-modal="true"` element at z-9999 for the rest of the
 *  session — invisible and pointer-transparent, but still telling assistive tech
 *  that a modal owns the page. */
type Phase = 'open' | 'leaving' | 'done'

export function BootIntro() {
  const rootRef = useRef<HTMLDivElement>(null)
  const trapped = useRef(false)
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('open')
  const [checked, setChecked] = useState(false)
  const [portraitSrc, setPortraitSrc] = useState(PORTRAIT)

  /* The gate is only legible on the client, so the first paint always contains
     the overlay and a returning visitor loses it again on the next frame. The
     inverse — render nothing, add the overlay after mount — would flash the page
     itself at every first-time visitor, which is the worse of the two flashes.

     Read here, written on completion. Splitting the two directions means Strict
     Mode's create/destroy/create can't race itself into skipping the intro. */
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY) === '1') setPhase('done')
    } catch {
      /* storage blocked (private mode, hardened settings) — just play it */
    }
    setChecked(true)
  }, [])

  const exit = useCallback(() => {
    setPhase((current) => (current === 'open' ? 'leaving' : current))
  }, [])

  useEffect(() => {
    if (phase !== 'leaving') return
    const timer = window.setTimeout(() => setPhase('done'), reduced ? 0 : EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [phase, reduced])

  useEffect(() => {
    if (phase !== 'done') return
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* see above */
    }
    // Only hand focus onward if we took it in the first place. A returning
    // visitor never saw the overlay, and yanking their focus to <main> on every
    // reload would be a regression, not a fix.
    if (trapped.current) document.getElementById('main')?.focus()
  }, [phase])

  /* Derived from `phase` rather than set once at mount, so the lock cannot
     outlive the overlay — including the case where the whole component unmounts
     mid-transition. */
  useEffect(() => {
    if (phase === 'done') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  /* Waits for `checked`. The overlay is in the very first commit so there is no
     flash of the page, but the gate has not been read yet at that point — taking
     focus there would move it for a returning visitor who never sees the intro,
     pushing them past the skip link and the whole navigation. One frame later we
     know whether this visitor is actually looking at an overlay. */
  useEffect(() => {
    if (phase !== 'open' || !checked) return
    rootRef.current?.focus()
    trapped.current = true

    const onKey = (event: KeyboardEvent) => {
      // The overlay holds no focusable children, so the trap reduces to "focus
      // does not leave". Without this, Tab walks into the page behind it, which
      // is scroll-locked and covered — reachable by keyboard, unreachable by eye.
      if (event.key === 'Tab') {
        event.preventDefault()
        return
      }
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
        event.preventDefault()
        exit()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, checked, exit])

  if (phase === 'done') return null

  const leaving = phase === 'leaving'

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      data-wr-boot-intro="true"
      role="dialog"
      aria-modal="true"
      aria-label="WebReceipt intro"
      onClick={exit}
      className={`fixed inset-0 z-[9999] cursor-pointer overflow-hidden bg-black outline-none transition-all ${leaving ? 'pointer-events-none -translate-y-6 opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: reduced ? '0ms' : `${EXIT_MS}ms`, transitionTimingFunction: EASE }}
    >
      <div className="absolute inset-0 z-0 opacity-20">
        <MatrixRain fontSize={17} opacity={0.75} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_45%_50%,rgba(0,0,0,.12),rgba(0,0,0,.72)_75%)]" />

      <div className="relative z-[2] mx-auto h-full max-w-[1500px] px-6 md:px-0">
        <div className="absolute inset-y-0 left-0 w-full md:w-[58%]">
          <img
            src={portraitSrc}
            alt="Michael Scofield intro portrait"
            onError={() => setPortraitSrc(FALLBACK)}
            className="h-full w-full bg-transparent object-contain object-left-bottom"
            style={{ objectPosition: 'left bottom', filter: 'brightness(.92) contrast(1.06)' }}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
          {/* `bg-matrix-400/70`, not `bg-matrix/70`: the bare scale name compiles
              to nothing, so this line was invisible. */}
          {!reduced && (
            <div className="absolute inset-x-0 top-0 h-px animate-scan bg-matrix-400/70" aria-hidden="true" />
          )}
        </div>

        <span className="absolute bottom-8 right-8 text-[11px] uppercase tracking-[0.32em] text-matrix-300/80 md:bottom-10 md:right-12">
          Click anywhere to enter
        </span>
      </div>
      <div className="crt-scanlines pointer-events-none absolute inset-0 z-[3] opacity-[0.14]" />
    </div>
  )
}
