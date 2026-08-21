'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MatrixRain } from './matrix-rain'

const PORTRAIT = '/scofield.png'
const EASE = 'cubic-bezier(0.23,1,0.32,1)'
const QUOTE = 'Every problem has a solution.'

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

  // A previous intro implementation could remain in a client-side cached tree.
  // Remove only duplicate quote panels outside this current intro, never the
  // actual intro content below.
  useEffect(() => {
    const hideLegacyQuote = () => {
      const root = rootRef.current
      if (!root) return

      const candidates = Array.from(document.body.querySelectorAll<HTMLElement>('*')).filter(
        (el) => !root.contains(el) && el.textContent?.includes(QUOTE),
      )

      for (const candidate of candidates) {
        let el: HTMLElement | null = candidate
        let box: HTMLElement | null = null

        while (el && el !== document.body) {
          const rect = el.getBoundingClientRect()
          const style = window.getComputedStyle(el)
          const hasBorder = parseFloat(style.borderTopWidth) > 0 || parseFloat(style.borderLeftWidth) > 0
          if (rect.width > 280 && rect.height > 70 && hasBorder) {
            box = el
            break
          }
          el = el.parentElement
        }

        if (box) {
          box.style.setProperty('display', 'none', 'important')
        }
      }
    }

    hideLegacyQuote()
    const observer = new MutationObserver(hideLegacyQuote)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
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
      <div className="absolute inset-0 z-0 opacity-25">
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
      <div className="crt-scanlines pointer-events-none absolute inset-0 z-[3] opacity-[0.14]" />
    </div>
  )
}
