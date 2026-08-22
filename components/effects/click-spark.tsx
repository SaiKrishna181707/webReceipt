'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { useReducedMotion } from '@/components/matrix/use-reduced-motion'
import { EFFECT_BRIGHT } from './palette'

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

/**
 * Click sparks rendered in viewport coordinates.
 *
 * The canvas is fixed to the viewport, so pointer coordinates must also stay in
 * viewport space. Using clientX/clientY directly avoids coordinate drift caused
 * by transformed or positioned ancestors around the wrapper.
 */
const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor = EFFECT_BRIGHT,
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1,
  className = '',
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 })
  const wakeRef = useRef<(() => void) | null>(null)
  const reduced = useReducedMotion()
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      sizeRef.current = { width, height, dpr }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const ease = useCallback(
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
      const { width, height, dpr } = sizeRef.current

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime
        if (elapsed >= duration) return false

        const progress = Math.max(0, elapsed / duration)
        const eased = ease(progress)
        const distance = eased * sparkRadius * extraScale
        const lineLength = sparkSize * (1 - eased)

        const cos = Math.cos(spark.angle)
        const sin = Math.sin(spark.angle)
        const x1 = spark.x + distance * cos
        const y1 = spark.y + distance * sin
        const x2 = spark.x + (distance + lineLength) * cos
        const y2 = spark.y + (distance + lineLength) * sin

        if (x2 < -sparkSize || y2 < -sparkSize || x1 > width + sparkSize || y1 > height + sparkSize) {
          return false
        }

        ctx.strokeStyle = sparkColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        return true
      })

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
  }, [sparkColor, sparkSize, sparkRadius, duration, ease, extraScale])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedRef.current) return

    const now = performance.now()
    for (let i = 0; i < sparkCount; i += 1) {
      sparksRef.current.push({
        x: event.clientX,
        y: event.clientY,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
      })
    }

    wakeRef.current?.()
  }

  return (
    <div className={`relative ${className}`.trim()} onPointerDown={handlePointerDown}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60]"
      />
      {children}
    </div>
  )
}

export default ClickSpark
