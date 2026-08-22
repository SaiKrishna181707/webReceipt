'use client'

import { useState } from 'react'

interface LogoProps {
  /** Root size in px. Kept compatible with existing callers. */
  size?: number
  /** Kept for API compatibility with existing callers. */
  flicker?: boolean
  className?: string
}

const ARTWORK = '/ChatGPT_Image_Aug_21,_2026,_10_14_22_AM.png'

/**
 * WebReceipt wordmark with a restrained React Bits-style spotlight interaction.
 * The effect follows the pointer, adds depth to the hero mark, and remains
 * invisible for touch pointers unless the user is actively hovering.
 */
export function WebReceiptLogo({ size = 21, className = '' }: LogoProps) {
  const [src, setSrc] = useState(ARTWORK)
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, visible: false })
  const height = size * 1.6

  return (
    <span
      role="img"
      aria-label="WebReceipt"
      className={`wr-logo-spotlight relative block shrink-0 overflow-hidden bg-black ${className}`}
      style={{ height, width: height * 4.6 }}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return
        const rect = event.currentTarget.getBoundingClientRect()
        setSpotlight({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
          visible: true,
        })
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') {
          setSpotlight((current) => ({ ...current, visible: true }))
        }
      }}
      onPointerLeave={() => setSpotlight((current) => ({ ...current, visible: false }))}
    >
      <img
        src={src}
        alt=""
        onError={() => setSrc('/webreceipt-mark.svg')}
        className="absolute max-w-none"
        style={{
          width: '126%',
          height: '290%',
          left: '-13%',
          top: '-95%',
          objectFit: 'fill',
        }}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: spotlight.visible ? 1 : 0,
          background: `radial-gradient(circle 58px at ${spotlight.x}% ${spotlight.y}%, rgba(123,255,160,.34), rgba(51,255,102,.10) 38%, transparent 72%)`,
          mixBlendMode: 'screen',
        }}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,.16) 48%, transparent 61%)',
          transform: spotlight.visible ? 'translateX(8%)' : 'translateX(-35%)',
          transition: 'transform 700ms cubic-bezier(.16,1,.3,1)',
          mixBlendMode: 'screen',
        }}
      />
    </span>
  )
}
