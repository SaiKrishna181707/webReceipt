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
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
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
      <div className="relative mx-auto flex h-full max-w-[1500px] flex-col items-center px-6 py-12 md:flex-row md:px-0 md:py-0">
        <div className="relative h-full w-full shrink-0 md:w-[58%]">
          <img
            src={portraitSrc}
            alt="Michael Scofield intro portrait"
            onError={() => setPortraitSrc('/webreceipt-mark.svg')}
            className="h-full w-full bg-black object-contain object-left-bottom"
            style={{ objectPosition: 'left bottom', filter: 'brightness(.92) contrast(1.06)' }}
          />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-black to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
          {!reduced && <div className="absolute inset-x-0 top-0 h-px animate-scan bg-matrix/70" aria-hidden="true" />}
        </div>

        <div className="flex w-full flex-1 items-end pb-10 md:items-center md:pb-0 md:pr-12">
          <div className="flex w-full items-center justify-between gap-6">
            <span className="text-xs uppercase tracking-[0.32em] text-void-300">Click anywhere to enter</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                exit()
              }}
              className="rounded-md border border-void-500 px-4 py-2 text-xs uppercase tracking-[0.28em] text-void-200 transition-colors duration-150 hover:border-matrix hover:text-matrix"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
      <div className="crt-scanlines pointer-events-none absolute inset-0 opacity-[0.14]" />
    </div>
  )
}
