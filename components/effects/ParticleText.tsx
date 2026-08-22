'use client'

import { useEffect, useRef } from 'react'

interface ParticleTextProps {
  text: string
  particleSize?: number
  density?: number
  color?: string
  highlightColor?: string
  scatter?: number
  gatherDuration?: number
  stagger?: number
  pointerRepel?: number
  repelRadius?: number
  idleDrift?: number
  trigger?: 'hover' | 'always'
  fontSize?: string
  fontWeight?: number
  fontFamily?: string
  glow?: boolean
}

type Particle = {
  x: number
  y: number
  tx: number
  ty: number
  vx: number
  vy: number
  seed: number
}

function parseFontSize(value: string, width: number) {
  const match = value.match(/clamp\(\s*([\d.]+)rem\s*,\s*([\d.]+)vw\s*,\s*([\d.]+)rem\s*\)/i)
  if (!match) return Number.parseFloat(value) || 64
  const min = Number(match[1]) * 16
  const fluid = (Number(match[2]) / 100) * width
  const max = Number(match[3]) * 16
  return Math.max(min, Math.min(fluid, max))
}

export default function ParticleText({
  text,
  particleSize = 2,
  density = 4,
  color = '#ffffff',
  highlightColor = '#8b5cf6',
  scatter = 180,
  gatherDuration = 1600,
  stagger = 420,
  pointerRepel = 40,
  repelRadius = 120,
  idleDrift = 0.7,
  trigger = 'hover',
  fontSize = 'clamp(3rem, 12vw, 8rem)',
  fontWeight = 800,
  fontFamily = 'inherit',
  glow = true,
}: ParticleTextProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hoveredRef = useRef(false)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let start = performance.now()
    let pointer = { x: -9999, y: -9999 }

    const build = () => {
      const rect = root.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const fontPx = parseFontSize(fontSize, width)
      const resolvedFontFamily = fontFamily === 'inherit' ? getComputedStyle(root).fontFamily : fontFamily
      const offscreen = document.createElement('canvas')
      offscreen.width = Math.max(1, Math.floor(width * dpr))
      offscreen.height = Math.max(1, Math.floor(height * dpr))
      const octx = offscreen.getContext('2d')
      if (!octx) return
      octx.setTransform(dpr, 0, 0, dpr, 0, 0)
      octx.clearRect(0, 0, width, height)
      octx.fillStyle = '#fff'
      octx.font = `${fontWeight} ${fontPx}px ${resolvedFontFamily}`
      octx.textAlign = 'center'
      octx.textBaseline = 'middle'

      const lines = text.split('\n')
      const lineHeight = fontPx * 0.9
      const firstY = height / 2 - ((lines.length - 1) * lineHeight) / 2
      lines.forEach((line, index) => octx.fillText(line, width / 2, firstY + index * lineHeight))

      const image = octx.getImageData(0, 0, offscreen.width, offscreen.height)
      const step = Math.max(2, density * 1.35)
      const particles: Particle[] = []
      for (let y = 0; y < offscreen.height; y += step * dpr) {
        for (let x = 0; x < offscreen.width; x += step * dpr) {
          const alpha = image.data[(Math.floor(y) * offscreen.width + Math.floor(x)) * 4 + 3]
          if (alpha > 110) {
            const tx = x / dpr
            const ty = y / dpr
            const angle = Math.random() * Math.PI * 2
            const distance = scatter * (0.35 + Math.random() * 0.65)
            particles.push({
              x: tx + Math.cos(angle) * distance,
              y: ty + Math.sin(angle) * distance,
              tx,
              ty,
              vx: 0,
              vy: 0,
              seed: Math.random() * Math.PI * 2,
            })
          }
        }
      }
      particlesRef.current = particles
      start = performance.now()
    }

    const move = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      hoveredRef.current = true
    }
    const leave = () => {
      hoveredRef.current = false
      pointer = { x: -9999, y: -9999 }
    }

    const draw = (now: number) => {
      const particles = particlesRef.current
      ctx.clearRect(0, 0, width, height)
      const active = trigger === 'always' || hoveredRef.current
      const elapsed = now - start
      const gather = active ? Math.min(1, elapsed / Math.max(1, gatherDuration + stagger)) : 0
      const ease = gather * gather * (3 - 2 * gather)

      for (const p of particles) {
        let targetX = p.tx
        let targetY = p.ty
        if (!active) {
          targetX += Math.cos(now * 0.0007 + p.seed) * idleDrift * 10
          targetY += Math.sin(now * 0.0009 + p.seed) * idleDrift * 10
        }
        p.x += (targetX - p.x) * (0.055 + ease * 0.09)
        p.y += (targetY - p.y) * (0.055 + ease * 0.09)

        const dx = p.x - pointer.x
        const dy = p.y - pointer.y
        const dist = Math.hypot(dx, dy)
        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) * pointerRepel
          p.x += (dx / dist) * force * 0.045
          p.y += (dy / dist) * force * 0.045
        }

        const mix = active ? Math.min(1, Math.max(0, (repelRadius - dist) / repelRadius)) : 0
        ctx.fillStyle = mix > 0.15 ? highlightColor : color
        if (glow) {
          ctx.shadowBlur = mix > 0.15 ? 10 : 5
          ctx.shadowColor = mix > 0.15 ? highlightColor : color
        } else {
          ctx.shadowBlur = 0
        }
        ctx.fillRect(p.x, p.y, particleSize, particleSize)
      }
      ctx.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }

    const observer = new ResizeObserver(build)
    observer.observe(root)
    root.addEventListener('pointermove', move, { passive: true })
    root.addEventListener('pointerleave', leave, { passive: true })
    build()
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerleave', leave)
    }
  }, [color, density, fontFamily, fontSize, fontWeight, gatherDuration, glow, highlightColor, idleDrift, particleSize, pointerRepel, repelRadius, scatter, stagger, text, trigger])

  return <div ref={rootRef} className="relative h-full w-full" aria-label={text}><canvas ref={canvasRef} className="absolute inset-0 h-full w-full" /></div>
}
