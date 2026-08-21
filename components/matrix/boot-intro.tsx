'use client'

import { useCallback, useEffect, useState } from 'react'

const PORTRAIT = '/scofield.png'
const EASE = 'cubic-bezier(0.23,1,0.32,1)'

export function BootIntro() {
  const [reduced, setReduced] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [portraitSrc, setPortraitSrc] = useState(PORTRAIT)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  const exit = useCallback(() => {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(() => {
      document.body.style.overflow = ''
      window.dispatchEvent(new Event('wr:intro-done'))
    }, reduced ? 0 : 460)
  }, [leaving, reduced])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        exit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exit])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="WebReceipt intro"
      onClick={exit}
      className={`fixed inset-0 z-[9999] cursor-pointer bg-black transition-all ${leaving ? 'pointer-events-none -translate-y-6 opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: reduced ? '0ms' : '460ms', transitionTimingFunction: EASE }}
    >
      <div className="relative mx-auto h-full max-w-[1500px] px-6 md:px-0">
        <div className="absolute inset-y-0 left-0 w-full md:w-[58%]">
          <img
            src={portraitSrc}
            alt="Michael Scofield intro portrait"
            onError={() => setPortraitSrc('/webreceipt-mark.svg')}
            className="h-full w-full bg-black object-contain object-left-bottom"
            style={{ objectPosition: 'left bottom', filter: 'brightness(.92) contrast(1.06)' }}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
          {!reduced && <div className="absolute inset-x-0 top-0 h-px animate-scan bg-matrix/70" aria-hidden="true" />}
        </div>

        <div className="pointer-events-none absolute left-[38%] top-1/2 w-[min(38rem,48vw)] -translate-y-1/2 md:left-[34%] md:w-[34rem]">
          <div className="relative rounded-lg border border-matrix/80 bg-black/85 px-7 py-5 shadow-[0_0_28px_rgba(51,255,102,0.16)]">
            <span className="absolute -left-3 top-1/2 h-5 w-5 -translate-y-1/2 rotate-45 border-b border-l border-matrix/80 bg-black/85" aria-hidden="true" />
            <p className="relative font-mono text-base leading-8 text-matrix-300 md:text-lg">
              Every problem has a solution.
              <br />
              You just have to be smart enough
              <br />
              to find it
            </p>
          </div>
        </div>

        <span className="absolute bottom-8 right-8 text-[11px] uppercase tracking-[0.32em] text-matrix-300/80 md:bottom-10 md:right-12">
          Click anywhere to enter
        </span>
      </div>
      <div className="crt-scanlines pointer-events-none absolute inset-0 opacity-[0.14]" />
    </div>
  )
}
