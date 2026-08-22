'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/components/matrix/use-reduced-motion'
import { EFFECT_ALARM, EFFECT_ALARM_PIXELS, EFFECT_BRIGHT, EFFECT_PIXELS } from './palette'

/* Fast, lightweight canvas pixel reveal used consistently across every card. */
class Pixel {
  width: number
  height: number
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  color: string
  speed: number
  size = 0
  sizeStep: number
  minSize = 0.5
  maxSizeInteger = 2
  maxSize: number
  delay: number
  counter = 0
  counterStep: number
  isIdle = false
  isReverse = false
  isShimmer = false

  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, x: number, y: number, color: string, speed: number, delay: number) {
    this.width = canvas.width
    this.height = canvas.height
    this.ctx = context
    this.x = x
    this.y = y
    this.color = color
    this.speed = this.getRandomValue(0.35, 1) * speed
    this.sizeStep = this.getRandomValue(0.28, 0.62)
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger)
    this.delay = delay
    this.counterStep = Math.random() * 5 + (this.width + this.height) * 0.018
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  draw() {
    const offset = this.maxSizeInteger * 0.5 - this.size * 0.5
    this.ctx.fillStyle = this.color
    this.ctx.fillRect(this.x + offset, this.y + offset, this.size, this.size)
  }

  appear() {
    this.isIdle = false
    if (this.counter <= this.delay) {
      this.counter += this.counterStep
      return
    }
    if (this.size >= this.maxSize) this.isShimmer = true
    if (this.isShimmer) this.shimmer()
    else this.size += this.sizeStep
    this.draw()
  }

  disappear() {
    this.isShimmer = false
    this.counter = 0
    if (this.size <= 0) {
      this.isIdle = true
      return
    }
    this.size -= 0.25
    this.draw()
  }

  shimmer() {
    if (this.size >= this.maxSize) this.isReverse = true
    else if (this.size <= this.minSize) this.isReverse = false
    this.size += this.isReverse ? -this.speed : this.speed
  }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
  if (value <= 0 || reducedMotion) return 0
  // Increased from 0.001 so hover reveals and shimmers complete noticeably faster.
  return Math.min(value * 0.0028, 0.28)
}

const VARIANTS = {
  matrix: { activeColor: EFFECT_BRIGHT, gap: 6, speed: 30, colors: EFFECT_PIXELS, noFocus: true },
  alarm: { activeColor: EFFECT_ALARM, gap: 6, speed: 30, colors: EFFECT_ALARM_PIXELS, noFocus: true },
  default: { activeColor: null, gap: 5, speed: 35, colors: '#f8fafc,#f1f5f9,#cbd5e1', noFocus: false },
  blue: { activeColor: '#e0f2fe', gap: 10, speed: 25, colors: '#e0f2fe,#7dd3fc,#0ea5e9', noFocus: false },
  yellow: { activeColor: '#fef08a', gap: 3, speed: 20, colors: '#fef08a,#fde047,#eab308', noFocus: false },
  pink: { activeColor: '#fecdd3', gap: 6, speed: 80, colors: '#fecdd3,#fda4af,#e11d48', noFocus: true },
} as const

interface PixelCardProps {
  variant?: keyof typeof VARIANTS
  gap?: number
  speed?: number
  colors?: string
  noFocus?: boolean
  className?: string
  children: React.ReactNode
}

export default function PixelCard({ variant = 'matrix', gap, speed, colors, noFocus, className = '', children }: PixelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pixelsRef = useRef<Pixel[]>([])
  const animationRef = useRef<number | null>(null)
  const timePreviousRef = useRef(0)
  const reducedMotion = useReducedMotion()

  const cfg = VARIANTS[variant] || VARIANTS.matrix
  const finalGap = gap ?? cfg.gap
  const finalSpeed = speed ?? cfg.speed
  const finalColors = colors ?? cfg.colors
  const finalNoFocus = noFocus ?? cfg.noFocus

  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const width = Math.floor(rect.width)
    const height = Math.floor(rect.height)
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    canvasRef.current.width = width
    canvasRef.current.height = height
    canvasRef.current.style.width = `${width}px`
    canvasRef.current.style.height = `${height}px`

    const colorsArray = finalColors.split(',')
    const step = Math.max(1, Math.floor(finalGap))
    const pxs: Pixel[] = []
    const revealSpeed = getEffectiveSpeed(finalSpeed, reducedMotion)

    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        const dx = x - width / 2
        const dy = y - height / 2
        const distance = Math.sqrt(dx * dx + dy * dy)
        const delay = reducedMotion ? 0 : distance * 0.45
        pxs.push(new Pixel(canvasRef.current, ctx, x, y, colorsArray[Math.floor(Math.random() * colorsArray.length)], revealSpeed, delay))
      }
    }
    pixelsRef.current = pxs
  }

  const doAnimate = (mode: 'appear' | 'disappear') => {
    animationRef.current = requestAnimationFrame(() => doAnimate(mode))
    const now = performance.now()
    const passed = now - timePreviousRef.current
    if (passed < 1000 / 60) return
    timePreviousRef.current = now - (passed % (1000 / 60))

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let allIdle = true
    for (const pixel of pixelsRef.current) {
      pixel[mode]()
      if (!pixel.isIdle) allIdle = false
    }

    if (allIdle && animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  const handleAnimation = (mode: 'appear' | 'disappear') => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    timePreviousRef.current = performance.now()
    animationRef.current = requestAnimationFrame(() => doAnimate(mode))
  }

  useEffect(() => {
    initPixels()
    const observer = new ResizeObserver(initPixels)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalGap, finalSpeed, finalColors, finalNoFocus, reducedMotion])

  return (
    <div
      ref={containerRef}
      className={`relative isolate overflow-hidden ${className}`.trim()}
      onMouseEnter={() => handleAnimation('appear')}
      onMouseLeave={() => handleAnimation('disappear')}
      onFocus={finalNoFocus ? undefined : (e) => { if (!e.currentTarget.contains(e.relatedTarget)) handleAnimation('appear') }}
      onBlur={finalNoFocus ? undefined : (e) => { if (!e.currentTarget.contains(e.relatedTarget)) handleAnimation('disappear') }}
      tabIndex={finalNoFocus ? undefined : 0}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 block" />
      {children}
    </div>
  )
}
