'use client'

import { useEffect, useRef } from 'react'

/* ============================================================================
   CODE RAIN

   One canvas, one requestAnimationFrame loop, no React state — the rain never
   causes a re-render. A DOM particle system at this density would be thousands
   of nodes and a permanent layout cost; here the whole environment is a single
   composited layer.

   Cost control, in order of impact:
     · the loop is throttled to ~20fps (the rain is *meant* to step, not glide)
     · device pixel ratio is capped at 1.5
     · the trail is a translucent black fill, so old glyphs decay for free
       instead of being tracked and erased
     · the loop stops entirely when the tab is hidden or motion is reduced
   ========================================================================== */

/** Half-width katakana, the glyphs the films actually used, plus digits. */
const GLYPHS =
  'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789$+-*/=%"\'#&_(),.;:?!\\|{}<>[]^~'

interface Column {
  /** Head position, in rows. Fractional so columns fall out of step. */
  y: number
  /** Rows per tick. */
  speed: number
  /** Rows until this column resets to the top. */
  length: number
  /** The glyph currently at the head — held for a few ticks, then swapped. */
  head: string
  ticks: number
}

export function MatrixRain({
  /** Glyph size in px. Larger reads calmer and costs less. */
  fontSize = 16,
  /** 0–1. The stylesheet's --rain-opacity thins this further on small screens. */
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
      const count = Math.ceil(width / fontSize)
      columns = Array.from({ length: count }, () => ({
        // Stagger the first fall so the screen doesn't start as one flat wave.
        y: -Math.random() * rows,
        speed: 0.32 + Math.random() * 0.7,
        length: 8 + Math.random() * 26,
        head: glyph(),
        ticks: 0,
      }))

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
    }

    /** One step of the rain: fade what's there, then stamp the new heads. */
    const draw = () => {
      // The trail. Lower alpha = longer tails; this is the only decay mechanism.
      ctx.fillStyle = 'rgba(0,0,0,0.085)'
      ctx.fillRect(0, 0, width, height)

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i]
        const x = i * fontSize
        const y = Math.floor(col.y) * fontSize

        if (col.y >= 0 && y < height) {
          // The glyph two rows back, dimmed — gives the tail its gradient
          // without keeping any per-glyph history.
          ctx.fillStyle = 'rgba(0,184,63,0.55)'
          ctx.fillText(glyph(), x, y - fontSize * 2)

          // The head is the bright one, and the only one that gets a halo.
          ctx.shadowColor = 'rgba(51,255,102,0.85)'
          ctx.shadowBlur = 8
          ctx.fillStyle = '#c9ffd8'
          ctx.fillText(col.head, x, y)
          ctx.shadowBlur = 0
        }

        col.y += col.speed
        col.ticks++
        // Hold each head glyph for a few ticks — constantly rerolling reads as
        // noise rather than falling code.
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
      // ~20fps. The rain is stepped in the films too; smoothness buys nothing.
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
      // Reduced motion still gets code on screen — a handful of static passes
      // so the environment exists. It simply never moves again.
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
