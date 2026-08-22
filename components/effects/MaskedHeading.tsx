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

/**
 * React-Bits-inspired masked headline: the media is visible through the glyphs
 * and is revealed with a clean wipe. The parallax listener is scroll-driven
 * rather than a permanent requestAnimationFrame loop so the hero stays cheap.
 */
export default function MaskedHeading({
  text,
  src,
  mediaType = 'image',
  poster,
  fillScale = 1.08,
  parallax = 0,
  reveal = 'wipe',
  trigger = 'view',
  className = '',
  fontSize = 'clamp(4rem, 8vw, 8rem)',
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
    let frame = 0
    const update = () => {
      frame = 0
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport
      setOffset(Math.max(-1, Math.min(1, progress)) * parallax)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [parallax])

  const style = {
    '--mh-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    '--mh-weight': fontWeight,
    '--mh-fill-scale': fillScale,
    '--mh-parallax': `${offset}px`,
  } as React.CSSProperties

  const mediaSource = mediaType === 'video' ? poster : src

  return (
    <div ref={ref} className={`mh-wrap ${active ? 'is-active' : ''} ${className}`} style={style}>
      <h1 className="mh-text" aria-label={text.replace(/\n/g, ' ')}>
        <span className="mh-solid" aria-hidden>{text}</span>
        {mediaSource && (
          <span className={`mh-media ${reveal === 'wipe' ? 'mh-wipe' : ''}`} aria-hidden>
            <span
              className="mh-media-text"
              style={{ backgroundImage: `url("${mediaSource}")` }}
            >
              {text}
            </span>
          </span>
        )}
      </h1>
      <style jsx>{`
        .mh-wrap {
          --mh-solid:#e7fff0;
          position:relative;
          width:100%;
          overflow:hidden;
        }
        .mh-text {
          position:relative;
          margin:0;
          font-family:inherit;
          font-size:var(--mh-size);
          font-weight:var(--mh-weight);
          line-height:.9;
          letter-spacing:-.055em;
          text-transform:uppercase;
          white-space:pre-line;
        }
        .mh-solid {
          display:block;
          color:var(--mh-solid);
          text-shadow:0 0 28px rgba(51,255,102,.10);
          transition:opacity .7s ease;
        }
        .is-active .mh-solid { opacity:.16; }
        .mh-media {
          position:absolute;
          inset:0;
          display:block;
          transform:translateY(var(--mh-parallax));
          transition:clip-path 1.15s cubic-bezier(.16,1,.3,1), transform .12s linear;
          clip-path:inset(0 100% 0 0);
          pointer-events:none;
        }
        .is-active .mh-media { clip-path:inset(0 0 0 0); }
        .mh-media-text {
          display:block;
          width:100%;
          height:100%;
          transform:scale(var(--mh-fill-scale));
          transform-origin:center;
          background-position:center;
          background-size:cover;
          background-repeat:no-repeat;
          background-clip:text;
          -webkit-background-clip:text;
          color:transparent;
          -webkit-text-fill-color:transparent;
          filter:saturate(1.08) contrast(1.03);
          text-shadow:0 0 22px rgba(51,255,102,.14);
        }
        @media (prefers-reduced-motion:reduce) {
          .mh-media { transition:none; transform:none; }
        }
      `}</style>
    </div>
  )
}
