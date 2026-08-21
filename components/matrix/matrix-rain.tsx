'use client'

import { useEffect, useRef } from 'react'

const GLYPHS =
  'ｱｲｳｴｵｶｷｸｹｿｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789$+-*/=%"\'#&_(),.;:?!\\|{}<>[]^~'

interface Column {
  x: number
  y: number
  speed: number
  length: number
  head: string
  ticks: number
}

export function MatrixRain({
  fontSize = 16,
  opacity = 0.42,
  className = '',
}: {
  fontSize?: number
  opacity?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let columns: Column[] = []
    let width = 0
    let height = 0
    let rows = 0
    let raf = 0
    let last = 0
    let resizeTimer: ReturnType<typeof setTimeout>

    const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `${fontSize}px "JetBrains Mono", ui-monospace, monospace`
      ctx.textBaseline = 'top'

      rows = Math.ceil(height / fontSize)
      // Keep a sparse set of streams, but distribute them across the entire viewport.
      const count = Math.max(1, Math.ceil((width / fontSize) * 0.11))
      columns = Array.from({ length: count }, () => ({
        x: Math.random() * Math.max(0, width - fontSize),
        y: -Math.random() * rows,
        speed: 0.32 + Math.random() * 0.7,
        length: 8 + Math.random() * 26,
        head: glyph(),
        ticks: 0,
      }))

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.085)'
      ctx.fillRect(0, 0, width, height)

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i]
        const x = col.x
        const y = Math.floor(col.y) * fontSize

        if (col.y >= 0 && y < height) {
          ctx.fillStyle = 'rgba(0,150,48,0.20)'
          ctx.fillText(glyph(), x, y - fontSize * 2)

          ctx.shadowColor = 'rgba(51,255,102,0.28)'
          ctx.shadowBlur = 4
          ctx.fillStyle = '#75b984'
          ctx.fillText(col.head, x, y)
          ctx.shadowBlur = 0
        }

        col.y += col.speed
        col.ticks++
        if (col.ticks % 3 === 0) col.head = glyph()

        if (col.y - col.length > rows) {
          col.y = -Math.random() * 12
          col.speed = 0.32 + Math.random() * 0.7
          col.length = 8 + Math.random() * 26
        }
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 50) return
      last = now
      draw()
    }

    const start = () => {
      if (raf || reduced) return
      last = 0
      raf = requestAnimationFrame(frame)
    }

    const stop = () => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        layout()
        if (reduced) draw()
      }, 180)
    }

    const onVisibility = () => (document.hidden ? stop() : start())

    layout()
    if (reduced) {
      for (let i = 0; i < 16; i++) draw()
    } else {
      start()
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fontSize])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`h-full w-full ${className}`}
      style={{ opacity, display: 'block' }}
    />
  )
}
