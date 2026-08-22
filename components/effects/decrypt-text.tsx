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
    let timer: ReturnType<typeof setInterval> | undefined
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        frame += 1
        const settled = Math.floor(frame / 2)
        const next = [...text].map((char, index) => {
          if (char === ' ') return ' '
          if (index < settled) return char
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        }).join('')
        setDisplay(next)
        if (settled >= text.length) {
          if (timer) window.clearInterval(timer)
          setDisplay(text)
        }
      }, 42)
    }, delay)

    return () => {
      window.clearTimeout(start)
      if (timer) window.clearInterval(timer)
    }
  }, [text, delay])

  return <span className={className}>{display}</span>
}
