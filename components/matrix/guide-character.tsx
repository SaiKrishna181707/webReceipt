'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, ChevronRight, MessageSquareCode } from 'lucide-react'
import { GuidePortrait } from './guide-portrait'

/* ============================================================================
   THE GUIDE

   A resident operator who says one short thing and gets out of the way. Sizing
   is the whole design: 76px of portrait and a panel capped at 20rem, anchored
   bottom-left, above the fold of nothing. It is a hint, not a companion — the
   brief was explicit that it must not dominate the interface, so:

     · one line of dialogue, two at most
     · it leaves on its own after 11s
     · dismissing it is remembered for the session
     · a 28px handle brings it back, for anyone who wants it

   Messages are per-route and each one points at the next place worth going.
   ========================================================================== */

type GuideLine = {
  /** Kept short — this is a hint, not documentation. */
  lines: string[]
  cta?: { label: string; href: string }
}

const SCRIPT: Record<string, GuideLine> = {
  '/': {
    lines: ['Every problem has a solution.', 'You just have to be smart enough to find it.'],
    cta: { label: 'Open the console', href: '/console' },
  },
  '/console': {
    lines: ['Observe the journey first.', 'The contract compiles from what the page actually promised.'],
    cta: { label: 'Stress it', href: '/mutation-lab' },
  },
  '/mutation-lab': {
    lines: ['Break it on purpose.', 'An untested system is a hope, not a plan.'],
    cta: { label: 'See the records', href: '/receipts' },
  },
  '/receipts': {
    lines: ['Every record here is sealed.', 'Alter one field and the hash stops matching.'],
    cta: { label: 'Read the spec', href: '/docs' },
  },
  '/docs': {
    lines: ['Eleven checks.', 'A contract is only valid when every one of them passes.'],
    cta: { label: 'Run it yourself', href: '/console' },
  },
}

const DISMISS_KEY = 'wr.guide.dismissed.v1'
/** How long a message stays before the guide withdraws. */
const LINGER_MS = 11_000

function scriptFor(pathname: string): GuideLine {
  if (SCRIPT[pathname]) return SCRIPT[pathname]
  const root = '/' + pathname.split('/')[1]
  return SCRIPT[root] ?? SCRIPT['/']
}

export function GuideCharacter() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(true)
  /** Route on which the reader opened the guide from the handle. The scheduled
      arrival below must not slam shut a panel they asked for. */
  const openedByHand = useRef<string | null>(null)

  // Read the session's dismissal once, on the client only.
  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  // Arrive after the opening sequence has cleared the screen. The timer is a
  // fallback in case the intro was skipped before it could fire its event.
  useEffect(() => {
    if (dismissed) return
    if (openedByHand.current === pathname) return
    setOpen(false)

    let show: ReturnType<typeof setTimeout>
    const arrive = () => {
      clearTimeout(show)
      show = setTimeout(() => setOpen(true), 700)
    }

    window.addEventListener('wr:intro-done', arrive)
    const fallback = setTimeout(arrive, sessionStorage.getItem('wr.intro.v1') === '1' ? 400 : 4200)

    return () => {
      window.removeEventListener('wr:intro-done', arrive)
      clearTimeout(fallback)
      clearTimeout(show)
    }
  }, [pathname, dismissed])

  // Withdraw on its own. Anyone who wants it back has the handle.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setOpen(false), LINGER_MS)
    return () => clearTimeout(t)
  }, [open, pathname])

  const dismiss = () => {
    openedByHand.current = null
    setOpen(false)
    setDismissed(true)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }

  const { lines, cta } = scriptFor(pathname)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          sessionStorage.removeItem(DISMISS_KEY)
          openedByHand.current = pathname
          setDismissed(false)
          setOpen(true)
        }}
        aria-label="Show system guide"
        className="fixed bottom-4 left-4 z-40 grid h-8 w-8 place-items-center rounded-[2px] border border-matrix-400/30 bg-black/80 text-matrix-400/70 backdrop-blur transition-colors hover:border-matrix-400/80 hover:text-matrix-300"
      >
        <MessageSquareCode size={14} aria-hidden />
      </button>
    )
  }

  return (
    <aside
      aria-label="System guide"
      className="animate-fade-in-up fixed bottom-4 left-4 z-40 flex max-w-[calc(100vw-2rem)] items-end gap-3"
    >
      <GuidePortrait size={76} cinematic={false} className="hidden shadow-[0_0_28px_-14px_rgba(51,255,102,.6)] sm:block" />

      <div className="terminal terminal-phosphor relative w-[min(20rem,calc(100vw-2rem))]">
        <div className="terminal-bar">
          <span className="status-dot status-dot-live" style={{ ['--dot' as string]: '#33ff66' }} aria-hidden />
          <span className="sys-label flex-1 truncate">Guide · secure channel</span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss guide"
            className="grid h-5 w-5 place-items-center text-void-300 transition-colors hover:text-matrix-300"
          >
            <X size={12} aria-hidden />
          </button>
        </div>

        <div className="relative z-[1] px-4 py-3">
          {lines.map((line, i) => (
            <p
              key={line}
              className={`font-mono text-[12.5px] leading-relaxed ${
                i === 0 ? 'sys-prompt text-matrix-200' : 'pl-[1.35em] text-void-200'
              } ${i === lines.length - 1 ? 'caret' : ''}`}
            >
              {line}
            </p>
          ))}

          {cta && (
            <Link
              href={cta.href}
              onClick={() => setOpen(false)}
              className="mt-2.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-matrix-400 transition-colors hover:text-matrix-200"
            >
              {cta.label}
              <ChevronRight size={11} aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}
