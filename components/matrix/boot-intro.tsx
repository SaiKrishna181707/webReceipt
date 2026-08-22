'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MatrixRain } from './matrix-rain'
import { useReducedMotion } from './use-reduced-motion'

const PORTRAIT = '/scofield.png'
const FALLBACK = '/webreceipt-mark.svg'
const EASE = 'cubic-bezier(0.23,1,0.32,1)'
const EXIT_MS = 460

type Phase = 'open' | 'leaving' | 'done'

/** Full-screen boot gate. It intentionally appears on every page load and
 * remains visible until the visitor explicitly clicks/presses a key to enter. */
export function BootIntro() {
  const rootRef = useRef<HTMLDivElement>(null)
  const trapped = useRef(false)
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('open')
  const [portraitSrc, setPortraitSrc] = useState(PORTRAIT)

  const exit = useCallback(() => {
    setPhase((current) => (current === 'open' ? 'leaving' : current))
  }, [])

  // Warm the portrait immediately so the opening screen does not reveal the
  // page while the image is still being fetched from the public assets folder.
  useEffect(() => {
    const preload = new window.Image()
    preload.src = PORTRAIT
  }, [])

  useEffect(() => {
    if (phase !== 'leaving') return
    const timer = window.setTimeout(() => setPhase('done'), reduced ? 0 : EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [phase, reduced])

  useEffect(() => {
    if (phase === 'done') {
      if (trapped.current) document.getElementById('main')?.focus()
      return
    }

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'open') return
    rootRef.current?.focus()
    trapped.current = true

    const onKey = (event: KeyboardEvent) => {
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
  }, [phase, exit])

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
