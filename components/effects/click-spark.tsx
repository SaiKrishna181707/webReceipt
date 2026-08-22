'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { useReducedMotion } from '@/components/matrix/use-reduced-motion'
import { EFFECT_BRIGHT } from './palette'

/* ============================================================================
   CLICK SPARK — vendored from React Bits (ts-tailwind), then adapted.

   A short burst of radial lines wherever the pointer lands. This is the only
   effect in `components/effects/` that is not WebGL: it is a 2D canvas over the
   whole page, drawing nothing at all most of the time.

   Changes from upstream:
     - `'use client'`
     - phosphor green instead of white (see ./palette)
     - `className` passthrough. Upstream hard-codes `relative w-full h-full` on
       its root, which would collapse the app's `main` layout when wrapped around
       a page.
     - the RAF loop parks itself when no sparks are alive and is woken by the next
       click. Upstream runs it for the life of the page, clearing an empty canvas
       sixty times a second.
     - the canvas is `fixed` and viewport-sized rather than stretched over the
       wrapper. Upstream's wrapper is a demo card; here it is a whole page, and a
       backing store that tall would cost ~100 MB.
     - honours `prefers-reduced-motion` by not sparking at all
     - device-pixel-ratio scaling, so a 2px line is a 2px line on a retina panel
       instead of a soft grey smear
   ========================================================================== */

interface ClickSparkProps {
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  extraScale?: number
  className?: string
  children?: React.ReactNode
}

interface Spark {
  x: number
  y: number
  angle: number
  startTime: number
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor = EFFECT_BRIGHT,
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1.0,
  className = '',
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  /** Set by the draw effect so a click can restart a parked loop. */
  const wakeRef = useRef<(() => void) | null>(null)

  const reduced = useReducedMotion()
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let resizeTimeout: ReturnType<typeof setTimeout>

    const resizeCanvas = () => {
      // Viewport, not the wrapper. The wrapper is a whole page — several thousand
      // pixels tall — and a backing store that size would cost ~100 MB for an
      // effect that lives 400 ms inside the visible frame.
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(width * dpr))
      const h = Math.max(1, Math.round(height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      sizeRef.current = { w: width, h: height, dpr }
    }

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 100)
    }

    window.addEventListener('resize', handleResize)
    resizeCanvas()

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case 'linear':
          return t
        case 'ease-in':
          return t * t
        case 'ease-in-out':
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        default:
          return t * (2 - t)
      }
    },
    [easing]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId = 0

    const draw = (timestamp: number) => {
      const { w, h, dpr } = sizeRef.current
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      sparksRef.current = sparksRef.current.filter((spark: Spark) => {
        const elapsed = timestamp - spark.startTime
        if (elapsed >= duration) {
          return false
        }

        const progress = elapsed / duration
        const eased = easeFunc(progress)

        const distance = eased * sparkRadius * extraScale
        const lineLength = sparkSize * (1 - eased)

        const x1 = spark.x + distance * Math.cos(spark.angle)
        const y1 = spark.y + distance * Math.sin(spark.angle)
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle)
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle)

        // Sparks are spawned in viewport coordinates, so this only ever trims one
        // that started at the very edge of the frame.
        if (x2 < -sparkSize || y2 < -sparkSize || x1 > w + sparkSize || y1 > h + sparkSize) {
          return true
        }

        ctx.strokeStyle = sparkColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        return true
      })

      // Nothing left to animate: stop until the next click wakes us. The canvas
      // has already been cleared by this pass, so it leaves no residue.
      if (sparksRef.current.length === 0) {
        animationId = 0
        return
      }
      animationId = requestAnimationFrame(draw)
    }

    wakeRef.current = () => {
      if (animationId === 0) animationId = requestAnimationFrame(draw)
    }

    return () => {
      wakeRef.current = null
      if (animationId !== 0) cancelAnimationFrame(animationId)
    }
  }, [sparkColor, sparkSize, sparkRadius, duration, easeFunc, extraScale])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (reducedRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const now = performance.now()
    for (let i = 0; i < sparkCount; i++) {
      sparksRef.current.push({ x, y, angle: (2 * Math.PI * i) / sparkCount, startTime: now })
    }

    wakeRef.current?.()
  }

  return (
    <div className={`relative ${className}`.trim()} onClick={handleClick}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]" />
      {children}
    </div>
  )
}

export default ClickSpark
