'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks `prefers-reduced-motion` and keeps tracking it — the user can flip the
 * OS setting while the page is open, and a one-shot read at mount would miss it.
 *
 * `globals.css` already collapses every CSS animation under this query, but a
 * `requestAnimationFrame` loop is invisible to a stylesheet. Anything that
 * animates in JS or WebGL has to ask this hook and honour the answer itself.
 *
 * Returns `false` during server render and on the first client frame, so the
 * markup matches and nothing hydrates mismatched. Effects that respect it should
 * therefore treat `true` as "stop", not "never start".
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  return reduced
}
