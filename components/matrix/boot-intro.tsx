'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from './use-reduced-motion'

/* ============================================================================
   BOOT INTRO

   A full-screen cover that types three lines and then lifts, revealing the page.
   It plays once per session — `sessionStorage`, not `localStorage`, so a new tab
   or a new day gets it again but a route change or a reload does not.

   It is a real modal while it is up: the body scroll is locked, focus is trapped
   inside it, and it is announced as a dialog. And when it is gone it is *gone* —
   `phase === 'done'` returns `null`, so no `aria-modal` node is left in the tree
   swallowing hit-tests and confusing assistive tech.
   ========================================================================== */

const PORTRAIT = '/scofield.png'
const LINES = ['Every problem has a solution.', 'You just have to be smart enough', 'to find it']
const EASE = 'cubic-bezier(0.23,1,0.32,1)'
const SEEN_KEY = 'wr:intro-seen'
const LIFT_MS = 460

/* The session check has to resolve before the browser paints, or a returning
   visitor sees a frame of black over content that is already loaded. `useEffect`
   runs after paint; `useLayoutEffect` runs before it. On the server neither runs,
   and calling `useLayoutEffect` there logs a warning, so pick per environment. */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function BootIntro() {
  const full = useMemo(() => LINES.join('\n'), [])
  const [phase, setPhase] = useState<'open' | 'leaving' | 'done'>('open')
  const [typed, setTyped] = useState(0)
  const [portraitSrc, setPortraitSrc] = useState(PORTRAIT)
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const complete = typed >= full.length

  // Session gate. Read only — the flag is written when the intro finishes, not
  // here. Writing it here would mean Strict Mode's create → destroy → create
  // cycle has the second invocation read a flag the first one just wrote, so the
  // intro would never play in development at all.
  useIsoLayoutEffect(() => {
    let seen = false
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      // Storage can throw outright in private modes and sandboxed frames. An
      // intro that plays every load beats one that crashes the layout.
    }
    if (seen) setPhase('done')
  }, [])

  // The scroll lock is derived from `phase` rather than set once at mount, so
  // every way the cover can end — the gate above, a click, Escape, an unmount,
  // Strict Mode — releases it through this one cleanup. Set-and-forget is how a
  // page ends up unscrollable with nothing on screen to explain why.
  //
  // Layout effect, not effect: the gate's `setPhase` is flushed before paint, so
  // a returning visitor never gets a locked frame either.
  useIsoLayoutEffect(() => {
    if (phase === 'done') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  // Marked seen once it has actually been watched and dismissed. A visitor who
  // reloads mid-intro never reached the end of it, and gets it again.
  useEffect(() => {
    if (phase !== 'done') return
    try {
      window.sessionStorage.setItem(SEEN_KEY, '1')
    } catch {}
  }, [phase])

  useEffect(() => {
    if (phase !== 'open') return
    if (reduced) {
      setTyped(full.length)
      return
    }
    let index = 0
    let interval: number | undefined
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1
        setTyped(index)
        if (index >= full.length && interval !== undefined) window.clearInterval(interval)
      }, 26)
    }, 900)
    return () => {
      window.clearTimeout(start)
      if (interval !== undefined) window.clearInterval(interval)
    }
  }, [full.length, reduced, phase])

  const exit = useCallback(() => {
    setPhase((current) => (current === 'open' ? 'leaving' : current))
  }, [])

  // The lift, then the unmount. Focus lands on the page itself rather than
  // wherever it was before the intro, because before the intro there was no page.
  // The scroll lock is released by the effect above, keyed on this same phase.
  useEffect(() => {
    if (phase !== 'leaving') return
    const timer = window.setTimeout(
      () => {
        setPhase('done')
        document.getElementById('main')?.focus({ preventScroll: true })
      },
      reduced ? 0 : LIFT_MS
    )
    return () => window.clearTimeout(timer)
  }, [phase, reduced])

  // Focus trap. There is only one control in here, so without the wrap a second
  // Tab walks straight into the page hidden behind the cover.
  useEffect(() => {
    if (phase !== 'open') return
    const root = rootRef.current
    if (!root) return
    root.focus({ preventScroll: true })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        exit()
        return
      }
      if (e.key !== 'Tab') return
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey ? active === first || active === root : active === last) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      }
    }

    // On the document, not the root: a stray click can move focus outside the
    // cover, and the keys still have to work when it does.
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [phase, exit])

  if (phase === 'done') return null

  const leaving = phase === 'leaving'
  const visible = full.slice(0, typed).split('\n')

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="WebReceipt intro"
      tabIndex={-1}
      onClick={exit}
      className={`fixed inset-0 z-[9999] cursor-pointer bg-black outline-none transition-all ${leaving ? 'pointer-events-none -translate-y-6 opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: reduced ? '0ms' : `${LIFT_MS}ms`, transitionTimingFunction: EASE }}
    >
      <div className="relative mx-auto flex h-full max-w-[1500px] flex-col items-center gap-8 px-6 py-12 md:flex-row md:gap-0 md:px-0 md:py-0">
        <div className="relative h-[42%] w-full shrink-0 md:h-full md:w-[48%]">
          <img
            src={portraitSrc}
            alt="Michael Scofield intro portrait"
            onError={() => setPortraitSrc('/webreceipt-mark.svg')}
            className="h-full w-full bg-black object-contain object-left-bottom"
            style={{ objectPosition: 'left bottom', filter: 'brightness(.92) contrast(1.06)' }}
          />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-black to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
          {!reduced && (
            <div className="absolute inset-x-0 top-0 h-px animate-scan bg-matrix-400/70" aria-hidden="true" />
          )}
        </div>

        <div className="flex w-full flex-1 items-center md:pr-16">
          <div className="relative w-full">
            <div
              className="absolute -left-2 top-16 hidden h-4 w-4 rotate-45 border-b border-l border-matrix-400 bg-black md:block"
              aria-hidden="true"
            />
            <div className="relative rounded-3xl border border-matrix-400 bg-black/90 px-7 py-8 shadow-matrix md:px-10 md:py-10">
              <p className="whitespace-pre-wrap text-lg leading-relaxed text-matrix-300 md:text-3xl md:leading-[1.5]">
                {visible.map((line, i) => (
                  <span key={`${line}-${i}`}>
                    {line}
                    {i < visible.length - 1 ? '\n' : null}
                  </span>
                ))}
                {!complete && !reduced && <span className="caret" />}
              </p>
            </div>

            <div
              className="mt-8 flex items-center justify-between gap-4 transition-opacity"
              style={{ opacity: complete ? 1 : 0, transitionDuration: reduced ? '0ms' : '200ms' }}
            >
              <span className="text-xs uppercase tracking-[0.32em] text-void-300">Click anywhere to enter</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  exit()
                }}
                className="rounded-md border border-void-500 px-4 py-2 text-xs uppercase tracking-[0.28em] text-void-200 transition-colors duration-150 hover:border-matrix-400 hover:text-matrix-300"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="crt-scanlines pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden="true" />
    </div>
  )
}
