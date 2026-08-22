'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface GatedEffectProps {
  /** The effect to mount. Rendered only while the wrapper is on screen. */
  children: ReactNode
  /**
   * How far outside the viewport to mount, as an IntersectionObserver margin.
   * A little slack means the shader has compiled by the time it scrolls into
   * view instead of popping in a frame late.
   */
  rootMargin?: string
  className?: string
}

/* ============================================================================
   GATED EFFECT

   A browser will only hold a handful of live WebGL contexts — Chrome caps around
   16 — and it drops the oldest without asking when you go past. Pausing an
   offscreen render loop is not enough: a paused context still holds its slot.

   So this unmounts its child entirely when it leaves the viewport, which runs the
   child's cleanup and releases the context, and mounts it again on the way back.
   Shader compilation is a few milliseconds; a lost context is a black rectangle
   somewhere else on the page.

   The always-on background tunnel deliberately does *not* go through this — it is
   the one effect that should hold its context for the life of the page.
   ========================================================================== */
export function GatedEffect({ children, rootMargin = '200px', className = '' }: GatedEffectProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // No IntersectionObserver (very old browsers, some test runners): mount and
    // leave it mounted. One extra context beats a permanently blank panel.
    if (typeof IntersectionObserver === 'undefined') {
      setOnScreen(true)
      return
    }

    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin })
    io.observe(host)
    return () => io.disconnect()
  }, [rootMargin])

  return (
    <div ref={hostRef} aria-hidden="true" className={className}>
      {onScreen ? children : null}
    </div>
  )
}
