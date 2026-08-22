'use client'

import { memo, useEffect, useRef } from 'react'

interface Dot {
  ax: number
  ay: number
  sx: number
  sy: number
}

interface DotFieldProps {
  dotRadius?: number
  dotSpacing?: number
  cursorRadius?: number
  bulgeStrength?: number
  glowRadius?: number
  sparkle?: boolean
  waveAmplitude?: number
  gradientFrom?: string
  gradientTo?: string
  glowColor?: string
  paused?: boolean
}

const TWO_PI = Math.PI * 2

/**
 * WebReceipt's DotField follows the React Bits Dot Field interaction model:
 * fixed circular dots, a large cursor bulge, and a soft cursor glow.
 * No idle wave, sparkle, painting/trailing, or square-pixel rendering.
 */
const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = '#08733a',
  gradientTo = '#48e886',
  glowColor = '#00ff66',
  paused = false,
}: DotFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 })
  const pausedRef = useRef(paused)
  const propsRef = useRef({ dotRadius, dotSpacing, cursorRadius, bulgeStrength, glowRadius, sparkle, waveAmplitude, gradientFrom, gradientTo, glowColor })

  pausedRef.current = paused
  propsRef.current = { dotRadius, dotSpacing, cursorRadius, bulgeStrength, glowRadius, sparkle, waveAmplitude, gradientFrom, gradientTo, glowColor }

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let lastTime = performance.now()
    let frame = 0

    const resize = () => {
      const rect = container.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const p = propsRef.current
      const step = p.dotRadius + p.dotSpacing
      const cols = Math.floor(width / step)
      const rows = Math.floor(height / step)
      const padX = (width % step) / 2
      const padY = (height % step) / 2
      const dots: Dot[] = new Array(rows * cols)

      let index = 0
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2
          const ay = padY + row * step + step / 2
          dots[index++] = { ax, ay, sx: ax, sy: ay }
        }
      }
      dotsRef.current = dots
    }

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      const mouse = mouseRef.current
      const x = clientX - rect.left
      const y = clientY - rect.top

      const dx = mouse.x < -100 ? 0 : x - mouse.x
      const dy = mouse.y < -100 ? 0 : y - mouse.y
      const distance = Math.hypot(dx, dy)
      mouse.speed += (distance - mouse.speed) * 0.5
      mouse.x = x
      mouse.y = y
    }

    const onPointerMove = (event: PointerEvent) => updatePointer(event.clientX, event.clientY)
    const onPointerLeave = () => {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
      mouseRef.current.prevX = -9999
      mouseRef.current.prevY = -9999
      mouseRef.current.speed = 0
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (pausedRef.current) return

      if (now - lastTime < 16) return
      lastTime = now
      frame++

      const p = propsRef.current
      const mouse = mouseRef.current
      const dots = dotsRef.current
      const cr = p.cursorRadius
      const crSq = cr * cr
      const rad = p.dotRadius / 2
      const engagement = Math.min(mouse.speed / 5, 1)
      const t = frame * 0.02

      mouse.speed *= 0.9

      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, p.gradientFrom)
      gradient.addColorStop(1, p.gradientTo)
      ctx.fillStyle = gradient
      ctx.clearRect(0, 0, width, height)
      ctx.beginPath()

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = mouse.x - dot.ax
        const dy = mouse.y - dot.ay
        const distSq = dx * dx + dy * dy

        if (distSq < crSq && engagement > 0.01) {
          const dist = Math.sqrt(distSq)
          const influence = 1 - dist / cr
          const push = influence * influence * p.bulgeStrength * engagement
          const angle = Math.atan2(dy, dx)
          const targetX = dot.ax - Math.cos(angle) * push
          const targetY = dot.ay - Math.sin(angle) * push
          dot.sx += (targetX - dot.sx) * 0.15
          dot.sy += (targetY - dot.sy) * 0.15
        } else {
          dot.sx += (dot.ax - dot.sx) * 0.1
          dot.sy += (dot.ay - dot.sy) * 0.1
        }

        let x = dot.sx
        let y = dot.sy
        if (p.waveAmplitude > 0) {
          y += Math.sin(dot.ax * 0.03 + t) * p.waveAmplitude
          x += Math.cos(dot.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5
        }

        let r = rad
        if (p.sparkle && engagement > 0.01) {
          const hash = ((i * 2654435761) ^ (frame >> 3)) >>> 0
          if (hash % 100 < 3) r *= 1.8
        }

        ctx.moveTo(x + r, y)
        ctx.arc(x, y, r, 0, TWO_PI)
      }

      ctx.fill()

      // Soft cursor glow, matching the React Bits interaction without painting trails.
      if (mouse.x > -100 && engagement > 0.01) {
        const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, p.glowRadius)
        glow.addColorStop(0, `${p.glowColor}22`)
        glow.addColorStop(0.45, `${p.glowColor}0b`)
        glow.addColorStop(1, `${p.glowColor}00`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, p.glowRadius, 0, TWO_PI)
        ctx.fill()
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('blur', onPointerLeave)
    resize()
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('blur', onPointerLeave)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative h-full w-full" aria-hidden>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  )
})

DotField.displayName = 'DotField'
export default DotField
