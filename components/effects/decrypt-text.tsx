'use client'

import { useEffect, useState } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>?/\\|'

interface DecryptTextProps {
  text: string
  className?: string
  delay?: number
}

export function DecryptText({ text, className = '', delay = 0 }: DecryptTextProps) {
  const [display, setDisplay] = useState(() => text.replace(/[^ ]/g, ''))

  useEffect(() => {
    let frame = 0
    // `window.setInterval`/`setTimeout` return a numeric handle in the browser.
    // `ReturnType<typeof setInterval>` resolves to NodeJS.Timeout here because
    // @types/node is in scope, which does not match what these calls return.
    let animationTimer: number | undefined
    let restartTimer: number | undefined
    let startTimer: number | undefined

    const decrypt = () => {
      frame = 0
      setDisplay(text.replace(/[^ ]/g, ''))

      animationTimer = window.setInterval(() => {
        frame += 1
        const settled = Math.floor(frame / 2)
        const next = [...text]
          .map((char, index) => {
            if (char === ' ') return ' '
            if (index < settled) return char
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          })
          .join('')

        setDisplay(next)

        if (settled >= text.length) {
          window.clearInterval(animationTimer)
          animationTimer = undefined
          setDisplay(text)
          restartTimer = window.setTimeout(decrypt, 5000)
        }
      }, 42)
    }

    startTimer = window.setTimeout(decrypt, delay)

    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(restartTimer)
      if (animationTimer) window.clearInterval(animationTimer)
    }
  }, [text, delay])

  // Keep the final text in the layout invisibly while the scrambled layer changes.
  // This prevents glyph-width changes from reflowing the hero and making the page jump.
  return (
    <span className={`inline-grid align-baseline ${className}`}>
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden="true">
        {text}
      </span>
      <span className="col-start-1 row-start-1 whitespace-nowrap" aria-live="off">
        {display}
      </span>
    </span>
  )
}
