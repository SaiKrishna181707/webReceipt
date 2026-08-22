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

/** React-Bits-style masked headline with event-driven interaction instead of a permanent RAF loop. */
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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true)
        observer.disconnect()
      }
    }, { threshold: 0.2 })
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
      <span className="mh-base" aria-hidden>{text}</span>
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
      <style jsx>{`
        .mh-root {
          position:relative;
          display:block;
          width:100%;
          margin:0;
          overflow:hidden;
          color:#e7fff0;
          text-wrap:balance;
          -webkit-font-smoothing:antialiased;
        }
        .mh-base {
          display:block;
          color:#e7fff0;
          opacity:.92;
          text-shadow:0 0 30px rgba(51,255,102,.10);
          transition:opacity .45s ease;
        }
        .is-active .mh-base { opacity:.10; }
        .mh-reveal {
          position:absolute;
          inset:0;
          overflow:hidden;
          pointer-events:none;
          opacity:1;
          clip-path:inset(0 0 0 0);
          transform:translate3d(0,0,0);
        }
        .mh-reveal-wipe { clip-path:inset(0 100% 0 0); }
        .is-active .mh-reveal-wipe {
          animation:mh-wipe var(--mh-duration) cubic-bezier(.16,1,.3,1) forwards;
        }
        .mh-reveal-fade {
          opacity:0;
          transform:scale(1.035);
        }
        .is-active .mh-reveal-fade {
          animation:mh-fade var(--mh-duration) cubic-bezier(.16,1,.3,1) forwards;
        }
        .mh-media {
          position:absolute;
          inset:-4%;
          display:block;
          color:transparent;
          -webkit-text-fill-color:transparent;
          background-position:center;
          background-repeat:no-repeat;
          background-size:cover;
          background-clip:text;
          -webkit-background-clip:text;
          transform:translate3d(var(--mh-x),var(--mh-y),0) scale(var(--mh-scale));
          filter:brightness(var(--mh-brightness)) saturate(var(--mh-saturation));
          text-shadow:0 0 26px rgba(51,255,102,.16);
          animation:mh-drift 8s ease-in-out infinite alternate;
          will-change:transform;
        }
        .mh-media-gray { filter:brightness(var(--mh-brightness)) saturate(var(--mh-saturation)) grayscale(1); }
        @keyframes mh-wipe {
          0% { clip-path:inset(0 100% 0 0); }
          100% { clip-path:inset(0 0 0 0); }
        }
        @keyframes mh-fade {
          0% { opacity:0; transform:scale(1.035); }
          100% { opacity:1; transform:scale(1); }
        }
        @keyframes mh-drift {
          0% { margin-left:calc(var(--mh-drift) * -1); margin-top:calc(var(--mh-drift) * .35); }
          100% { margin-left:var(--mh-drift); margin-top:calc(var(--mh-drift) * -.35); }
        }
        @media (prefers-reduced-motion:reduce) {
          .mh-reveal-wipe,.mh-reveal-fade,.mh-media { animation:none; }
          .mh-reveal { clip-path:inset(0); opacity:1; transform:none; }
          .mh-media { transform:scale(var(--mh-scale)); }
        }
      `}</style>
    </Tag>
  )
}
