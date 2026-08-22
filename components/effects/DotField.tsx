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
  cursorRadius = 150,
  bulgeStrength = 32,
  glowRadius = 42,
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

    const baseCanvas = document.createElement('canvas')
    const baseCtx = baseCanvas.getContext('2d')
    if (!baseCtx) return

    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let lastTime = performance.now()
    let cols = 0
    let rows = 0
    let dirty = true
    const active = new Set<number>()

    const resize = () => {
      const rect = container.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const p = propsRef.current
      const step = p.dotRadius + p.dotSpacing
      cols = Math.ceil(width / step) + 1
      rows = Math.ceil(height / step) + 1
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
      active.clear()

      baseCanvas.width = Math.max(1, Math.floor(width))
      baseCanvas.height = Math.max(1, Math.floor(height))
      baseCtx.setTransform(1, 0, 0, 1, 0, 0)
      baseCtx.clearRect(0, 0, width, height)

      const gradient = baseCtx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, p.gradientFrom)
      gradient.addColorStop(1, p.gradientTo)
      baseCtx.fillStyle = gradient
      const r = p.dotRadius / 2
      for (const dot of dots) {
        baseCtx.beginPath()
        baseCtx.arc(dot.ax, dot.ay, r, 0, Math.PI * 2)
        baseCtx.fill()
      }

      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(baseCanvas, 0, 0, width, height)
      dirty = true
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
      dirty = true
    }

    const onPointerLeave = () => {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
      mouseRef.current.speed = 0
      dirty = true
    }

    const settle = (dt: number, dots: Dot[]) => {
      for (const index of active) {
        const dot = dots[index]
        if (!dot) continue
        dot.sx += (dot.ax - dot.sx) * 0.18 * dt
        dot.sy += (dot.ay - dot.sy) * 0.18 * dt
        if (Math.abs(dot.sx - dot.ax) < 0.15 && Math.abs(dot.sy - dot.ay) < 0.15) {
          dot.sx = dot.ax
          dot.sy = dot.ay
          active.delete(index)
        }
      }
    }

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 33.33, 2)
      if (now - lastTime < 30) {
        raf = requestAnimationFrame(draw)
        return
      }
      lastTime = now

      if (!pausedRef.current && dirty) {
        const p = propsRef.current
        const mouse = mouseRef.current
        const dots = dotsRef.current
        const radius = p.cursorRadius
        const radiusSq = radius * radius
        const dotR = p.dotRadius / 2
        const hasPointer = mouse.x > -100
        const step = p.dotRadius + p.dotSpacing
        const engagement = Math.min(mouse.speed / 5, 1)

        if (hasPointer) {
          const minX = Math.max(0, mouse.x - radius - step)
          const maxX = Math.min(width, mouse.x + radius + step)
          const minY = Math.max(0, mouse.y - radius - step)
          const maxY = Math.min(height, mouse.y + radius + step)
          const startCol = Math.max(0, Math.floor((minX - 2) / step))
          const endCol = Math.min(cols - 1, Math.ceil((maxX + 2) / step))
          const startRow = Math.max(0, Math.floor((minY - 2) / step))
          const endRow = Math.min(rows - 1, Math.ceil((maxY + 2) / step))

          if (engagement > 0.01) {
            for (let row = startRow; row <= endRow; row++) {
              const rowOffset = row * cols
              for (let col = startCol; col <= endCol; col++) {
                const index = rowOffset + col
                const dot = dots[index]
                if (!dot) continue
                const dx = mouse.x - dot.ax
                const dy = mouse.y - dot.ay
                const distSq = dx * dx + dy * dy
                if (distSq >= radiusSq) continue

                active.add(index)
                const dist = Math.sqrt(distSq)
                const influence = 1 - dist / radius
                const push = influence * influence * p.bulgeStrength * engagement
                const angle = Math.atan2(dy, dx)
                const targetX = dot.ax - Math.cos(angle) * push
                const targetY = dot.ay - Math.sin(angle) * push
                dot.sx += (targetX - dot.sx) * 0.17 * dt
                dot.sy += (targetY - dot.sy) * 0.17 * dt
              }
            }
          } else {
            settle(dt, dots)
          }
        } else {
          settle(dt, dots)
        }

        mouse.speed *= Math.pow(0.90, dt)

        ctx.clearRect(0, 0, width, height)
        for (const index of active) {
          const dot = dots[index]
          if (!dot) continue
          let x = dot.sx
          let y = dot.sy
          if (p.waveAmplitude > 0) {
            y += Math.sin(dot.ax * 0.03 + now * 0.0012) * p.waveAmplitude
            x += Math.cos(dot.ay * 0.03 + now * 0.0008) * p.waveAmplitude * 0.5
          }
          const dx = x - dot.ax
          const dy = y - dot.ay
          const displacement = Math.min(1, Math.hypot(dx, dy) / Math.max(p.bulgeStrength, 1))
          const r = p.sparkle && mouse.speed > 0.1 && index % 37 === Math.floor(now / 33) % 37 ? dotR * 1.8 : dotR * (1 + displacement * 0.35)
          ctx.fillStyle = p.gradientTo
          ctx.fillRect(x - r, y - r, r * 2, r * 2)
        }

        if (hasPointer && active.size) {
          const glowRadius = Math.min(p.glowRadius, 42)
          const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowRadius)
          glow.addColorStop(0, `${p.glowColor}08`)
          glow.addColorStop(0.55, `${p.glowColor}03`)
          glow.addColorStop(1, `${p.glowColor}00`)
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(mouse.x, mouse.y, glowRadius, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalCompositeOperation = 'destination-over'
        ctx.drawImage(baseCanvas, 0, 0, width, height)
        ctx.globalCompositeOperation = 'source-over'
        dirty = hasPointer || active.size > 0
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
