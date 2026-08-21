'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const PORTRAIT = '/scofield.png'
const LINES = ['Every problem has a solution.', 'You just have to be smart enough', 'to find it']
const EASE = 'cubic-bezier(0.23,1,0.32,1)'

export function BootIntro() {
  const full = useMemo(() => LINES.join('\n'), [])
  const [reduced, setReduced] = useState(false)
  const [typed, setTyped] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [portraitSrc, setPortraitSrc] = useState(PORTRAIT)
  const complete = typed >= full.length

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
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
  }, [full.length, reduced])

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

  const visible = full.slice(0, typed).split('\n')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="WebReceipt intro"
      onClick={exit}
      className={`fixed inset-0 z-[9999] cursor-pointer bg-black transition-all ${leaving ? 'pointer-events-none -translate-y-6 opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: reduced ? '0ms' : '460ms', transitionTimingFunction: EASE }}
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
          {!reduced && <div className="absolute inset-x-0 top-0 h-px animate-scan bg-matrix/70" aria-hidden="true" />}
        </div>

        <div className="flex w-full flex-1 items-center md:pr-16">
          <div className="relative w-full">
            <div className="absolute -left-2 top-16 hidden h-4 w-4 rotate-45 border-b border-l border-matrix bg-black md:block" aria-hidden="true" />
            <div className="relative rounded-3xl border border-matrix bg-black/90 px-7 py-8 shadow-phosphor md:px-10 md:py-10">
              <p className="whitespace-pre-wrap text-lg leading-relaxed text-matrix md:text-3xl md:leading-[1.5]">
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
                className="rounded-md border border-void-500 px-4 py-2 text-xs uppercase tracking-[0.28em] text-void-200 transition-colors duration-150 hover:border-matrix hover:text-matrix"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="crt-scanlines pointer-events-none absolute inset-0 opacity-[0.14]" />
    </div>
  )
}
