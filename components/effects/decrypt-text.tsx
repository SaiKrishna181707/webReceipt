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
    let animationTimer: ReturnType<typeof setInterval> | undefined
    let restartTimer: ReturnType<typeof setTimeout> | undefined
    let startTimer: ReturnType<typeof setTimeout> | undefined

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

  return <span className={className}>{display}</span>
}
