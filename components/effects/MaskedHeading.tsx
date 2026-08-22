'use client'

import { useEffect, useRef, useState } from 'react'

type Reveal = 'wipe' | 'fade' | 'none'
type Trigger = 'view' | 'mount' | 'hover'

interface MaskedHeadingProps {
  text: string
  tag?: 'h1' | 'h2' | 'h3' | 'div'
  mediaType?: 'image' | 'video'
  src?: string
  poster?: string
  fillScale?: number
  parallax?: number
  drift?: number
  brightness?: number
  saturation?: number
  grayscale?: boolean
  reveal?: Reveal
  duration?: number
  stagger?: number
  trigger?: Trigger
  align?: 'left' | 'center' | 'right'
  weight?: number
  tracking?: number
  lineHeight?: number
  textScale?: number
  className?: string
  fontSize?: string | number
  fontWeight?: number
}

/**
 * React-Bits-style masked headline without a permanent animation loop.
 * The media is visible only through the glyphs, while a clipped wipe reveals
 * it on mount/view. Pointer parallax is event-driven so the hero stays cheap.
 */
export default function MaskedHeading({
  text,
  tag: Tag = 'h1',
  mediaType = 'image',
  src = '',
  poster = '',
  fillScale = 1.12,
  parallax = 16,
  drift = 5,
  brightness = 0.95,
  saturation = 1.05,
  grayscale = false,
  reveal = 'wipe',
  duration = 1.15,
  stagger = 0.06,
  trigger = 'view',
  align = 'left',
  weight = 800,
  tracking = -0.045,
  lineHeight = 0.94,
  textScale = 0.075,
  className = '',
  fontSize,
  fontWeight,
}: MaskedHeadingProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const [active, setActive] = useState(trigger === 'mount')
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (trigger !== 'view' || !rootRef.current) return
    const node = rootRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [trigger])

  useEffect(() => {
    const node = rootRef.current
    if (!node || trigger !== 'hover') return

    const enter = () => setActive(true)
    const move = (event: PointerEvent) => {
      if (!parallax) return
      const rect = node.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1
      const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1
      setOffset({ x: -x * parallax, y: -y * parallax })
    }
    const leave = () => setOffset({ x: 0, y: 0 })

    node.addEventListener('pointerenter', enter)
    node.addEventListener('pointermove', move, { passive: true })
    node.addEventListener('pointerleave', leave)
    return () => {
      node.removeEventListener('pointerenter', enter)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerleave', leave)
    }
  }, [parallax, trigger])

  useEffect(() => {
    if (trigger !== 'mount') return
    setActive(false)
    const id = requestAnimationFrame(() => setActive(true))
    return () => cancelAnimationFrame(id)
  }, [trigger, text])

  const size = fontSize ?? `clamp(3.35rem, ${Math.round(textScale * 1000) / 10}vw, 6.6rem)`
  const finalWeight = fontWeight ?? weight
  const mediaSource = mediaType === 'video' ? poster : src

  return (
    <Tag
      ref={rootRef as never}
      className={`mh-root ${active ? 'is-active' : ''} ${className}`.trim()}
      style={{
        textAlign: align,
        fontSize: typeof size === 'number' ? `${size}px` : size,
        fontWeight: finalWeight,
        letterSpacing: `${tracking}em`,
        lineHeight,
        '--mh-x': `${offset.x}px`,
        '--mh-y': `${offset.y}px`,
        '--mh-scale': fillScale,
        '--mh-brightness': brightness,
        '--mh-saturation': saturation,
        '--mh-duration': `${duration}s`,
        '--mh-delay': `${stagger}s`,
        '--mh-drift': `${drift}px`,
      } as React.CSSProperties}
    >
      <span className="mh-base" aria-hidden>
        {text}
      </span>
      {mediaSource && (
        <span className={`mh-reveal ${reveal === 'wipe' ? 'mh-reveal-wipe' : ''} ${reveal === 'fade' ? 'mh-reveal-fade' : ''}`} aria-hidden>
          <span
            className={`mh-media ${grayscale ? 'mh-media-gray' : ''}`}
            style={{ backgroundImage: `url("${mediaSource}")` }}
          >
            {text}
          </span>
        </span>
      )}
    </Tag>
  )
}
