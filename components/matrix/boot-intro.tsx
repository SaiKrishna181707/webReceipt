'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MatrixRain } from './matrix-rain'

const PORTRAIT = '/scofield.png'
const EASE = 'cubic-bezier(0.23,1,0.32,1)'

export function BootIntro() {
  const rootRef = useRef<HTMLDivElement>(null)
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
      ref={rootRef}
      data-wr-boot-intro="true"
      role="dialog"
      aria-modal="true"
      aria-label="WebReceipt intro"
      onClick={exit}
      className={`fixed inset-0 z-[9999] cursor-pointer overflow-hidden bg-black transition-all ${leaving ? 'pointer-events-none -translate-y-6 opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: reduced ? '0ms' : '460ms', transitionTimingFunction: EASE }}
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
            onError={() => setPortraitSrc('/webreceipt-mark.svg')}
            className="h-full w-full bg-transparent object-contain object-left-bottom"
            style={{ objectPosition: 'left bottom', filter: 'brightness(.92) contrast(1.06)' }}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
          {!reduced && <div className="absolute inset-x-0 top-0 h-px animate-scan bg-matrix/70" aria-hidden="true" />}
        </div>

        <span className="absolute bottom-8 right-8 text-[11px] uppercase tracking-[0.32em] text-matrix-300/80 md:bottom-10 md:right-12">
          Click anywhere to enter
        </span>
      </div>
      <div className="crt-scanlines pointer-events-none absolute inset-0 z-[3] opacity-[0.14]" />
    </div>
  )
}
