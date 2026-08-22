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

const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 25,
  cursorRadius = 500,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = '#0b6b35',
  gradientTo = '#7dffab',
  glowColor = '#00ff66',
  paused = false,
}: DotFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999, speed: 0 })
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
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let frame = 0
    let raf = 0
    let lastTime = performance.now()

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
      const cols = Math.ceil(width / step) + 1
      const rows = Math.ceil(height / step) + 1
      const padX = (width - (cols - 1) * step) / 2
      const padY = (height - (rows - 1) * step) / 2
      const dots: Dot[] = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step
          const ay = padY + row * step
          dots.push({ ax, ay, sx: ax, sy: ay })
        }
      }
      dotsRef.current = dots
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const nextX = event.clientX - rect.left
      const nextY = event.clientY - rect.top
      const mouse = mouseRef.current
      const dx = nextX - mouse.x
      const dy = nextY - mouse.y
      const distance = mouse.x < -100 ? 0 : Math.hypot(dx, dy)
      mouse.speed += (distance - mouse.speed) * 0.35
      mouse.x = nextX
      mouse.y = nextY
    }

    const onPointerLeave = () => {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
      mouseRef.current.speed = 0
    }

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 2)
      lastTime = now
      frame++
      if (!pausedRef.current) {
        const p = propsRef.current
        const mouse = mouseRef.current
        const dots = dotsRef.current
        const radius = p.cursorRadius
        const radiusSq = radius * radius
        const dotR = p.dotRadius / 2
        const engagement = Math.min(mouse.speed / 5, 1)
        mouse.speed *= Math.pow(0.92, dt)
        ctx.clearRect(0, 0, width, height)
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, p.gradientFrom)
        gradient.addColorStop(1, p.gradientTo)
        ctx.fillStyle = gradient
        ctx.beginPath()
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i]
          const dx = mouse.x - dot.ax
          const dy = mouse.y - dot.ay
          const distSq = dx * dx + dy * dy
          if (distSq < radiusSq && engagement > 0.01) {
            const dist = Math.sqrt(distSq)
            const influence = 1 - dist / radius
            const push = influence * influence * p.bulgeStrength * engagement
            const angle = Math.atan2(dy, dx)
            const targetX = dot.ax - Math.cos(angle) * push
            const targetY = dot.ay - Math.sin(angle) * push
            dot.sx += (targetX - dot.sx) * 0.16 * dt
            dot.sy += (targetY - dot.sy) * 0.16 * dt
          } else {
            dot.sx += (dot.ax - dot.sx) * 0.1 * dt
            dot.sy += (dot.ay - dot.sy) * 0.1 * dt
          }
          let x = dot.sx
          let y = dot.sy
          if (p.waveAmplitude > 0) {
            y += Math.sin(dot.ax * 0.03 + frame * 0.02) * p.waveAmplitude
            x += Math.cos(dot.ay * 0.03 + frame * 0.014) * p.waveAmplitude * 0.5
          }
          const r = p.sparkle && mouse.speed > 0.1 && i % 37 === frame % 37 ? dotR * 1.8 : dotR
          ctx.moveTo(x + r, y)
          ctx.arc(x, y, r, 0, Math.PI * 2)
        }
        ctx.fill()
        if (engagement > 0.01 && mouse.x > -100) {
          const glowRadius = Math.min(p.glowRadius, 120)
          const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowRadius)
          glow.addColorStop(0, `${p.glowColor}20`)
          glow.addColorStop(0.45, `${p.glowColor}0b`)
          glow.addColorStop(1, `${p.glowColor}00`)
          ctx.fillStyle = glow
          ctx.fillRect(mouse.x - glowRadius, mouse.y - glowRadius, glowRadius * 2, glowRadius * 2)
        }
      }
      raf = requestAnimationFrame(draw)
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
