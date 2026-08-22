'use client'

import { useEffect, useRef, useState } from 'react'

interface MaskedHeadingProps {
  text: string
  src?: string
  mediaType?: 'image' | 'video'
  poster?: string
  fillScale?: number
  parallax?: number
  reveal?: 'wipe' | 'none'
  trigger?: 'view' | 'mount'
  className?: string
  fontSize?: string | number
  fontWeight?: number
}

export default function MaskedHeading({
  text,
  src,
  mediaType = 'image',
  poster,
  fillScale = 1.15,
  parallax = 18,
  reveal = 'wipe',
  trigger = 'view',
  className = '',
  fontSize = 'clamp(4rem, 9vw, 8.5rem)',
  fontWeight = 800,
}: MaskedHeadingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(trigger === 'mount')
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (trigger !== 'view' || !ref.current) return
    const node = ref.current
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true)
        observer.disconnect()
      }
    }, { threshold: 0.15 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [trigger])

  useEffect(() => {
    if (!parallax) return
    let raf = 0
    const update = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport
      setOffset(Math.max(-1, Math.min(1, progress)) * parallax)
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [parallax])

  const style = {
    '--mh-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    '--mh-weight': fontWeight,
    '--mh-fill-scale': fillScale,
    '--mh-parallax': `${offset}px`,
  } as React.CSSProperties

  return (
    <div ref={ref} className={`mh-wrap ${active ? 'is-active' : ''} ${className}`} style={style}>
      <h1 className="mh-text" aria-label={text.replace(/\n/g, ' ')}>
        <span className="mh-solid" aria-hidden>{text}</span>
        <span className={`mh-media ${reveal === 'wipe' ? 'mh-wipe' : ''}`} aria-hidden>
          {mediaType === 'video' && src ? (
            <span className="mh-media-text" style={{ backgroundImage: `url("${poster ?? ''}")` }}>{text}</span>
          ) : (
            <span
              className={`mh-media-text ${!src ? 'mh-generated' : ''}`}
              style={src ? { backgroundImage: `url("${src}")` } : undefined}
            >
              {text}
            </span>
          )}
        </span>
      </h1>
      <style jsx>{`
        .mh-wrap { --mh-solid:#dfffea; position:relative; width:100%; overflow:hidden; }
        .mh-text { position:relative; margin:0; font-family:inherit; font-size:var(--mh-size); font-weight:var(--mh-weight); line-height:.88; letter-spacing:-.055em; text-transform:uppercase; white-space:pre-line; }
        .mh-solid { display:block; color:var(--mh-solid); text-shadow:0 0 32px rgba(51,255,102,.12); }
        .mh-media { position:absolute; inset:0; display:block; transform:translateY(var(--mh-parallax)); transition:clip-path 1.2s cubic-bezier(.16,1,.3,1),transform .08s linear; clip-path:inset(0 100% 0 0); pointer-events:none; }
        .is-active .mh-media { clip-path:inset(0 0 0 0); }
        .mh-media-text { display:block; width:100%; height:100%; transform:scale(var(--mh-fill-scale)); transform-origin:center; background-position:center; background-size:cover; background-repeat:no-repeat; background-color:#4dff82; background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; text-shadow:0 0 24px rgba(51,255,102,.16); }
        .mh-generated { background-image:linear-gradient(rgba(255,255,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(51,255,102,.2) 1px,transparent 1px),radial-gradient(circle at 70% 45%,rgba(51,255,102,.95),transparent 30%),linear-gradient(115deg,#f1fff6,#5bff8c 45%,#d8ffe5 72%,#22e861); background-size:22px 22px,22px 22px,100% 100%,100% 100%; }
        @media (prefers-reduced-motion:reduce) { .mh-media { transition:none; transform:none; } }
      `}</style>
    </div>
  )
}
