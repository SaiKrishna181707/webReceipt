'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* ============================================================================
   THE SCAN SYSTEM — one implementation, shared by every surface.

   A scan is how this interface acknowledges an action: the border lights, a
   line sweeps the surface, a terminal word reports progress, and then it hands
   off. Total runtime is 620ms — long enough to read ACCESS GRANTED, short
   enough that it never feels like waiting.

   Cards, buttons, panels and navigation all drive the same hook. Nothing here
   re-implements a sweep locally.
   ========================================================================== */

export type ScanPhase = 'idle' | 'scanning' | 'verifying' | 'granted'

/** Phase boundaries in ms. The last value is the total. */
const MARKS = { verifying: 230, granted: 440, done: 620 } as const

const READOUT: Record<Exclude<ScanPhase, 'idle'>, string> = {
  scanning: 'Scanning…',
  verifying: 'Verifying…',
  granted: 'Access granted',
}

export function scanReadout(phase: ScanPhase): string {
  return phase === 'idle' ? '' : READOUT[phase]
}

/**
 * Runs a scan, then calls `onComplete`. Re-entrant calls are ignored while one
 * is already running, so a double-click can't fire the action twice.
 *
 * Reduced motion collapses the whole thing to an immediate handoff — there is
 * no point animating a sweep the user has asked not to see.
 */
export function useScan(onComplete?: () => void, { skip = false }: { skip?: boolean } = {}) {
  const [phase, setPhase] = useState<ScanPhase>('idle')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const done = useRef(onComplete)
  done.current = onComplete

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => clear, [clear])

  const run = useCallback(() => {
    if (phase !== 'idle') return

    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (skip || reduced) {
      done.current?.()
      return
    }

    setPhase('scanning')
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms))
    at(MARKS.verifying, () => setPhase('verifying'))
    at(MARKS.granted, () => setPhase('granted'))
    at(MARKS.done, () => {
      setPhase('idle')
      done.current?.()
    })
  }, [phase, skip])

  return {
    phase,
    /** True for the whole 620ms window. */
    scanning: phase !== 'idle',
    run,
    /** Spread onto the scanned element to light its border. */
    hostProps: { 'data-scan': phase === 'idle' ? undefined : 'run' } as const,
  }
}
