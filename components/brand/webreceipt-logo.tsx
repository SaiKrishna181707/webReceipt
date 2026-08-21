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

export function WebReceiptLogo({ size = 21, className = '' }: LogoProps) {
  const [src, setSrc] = useState(ARTWORK)
  const height = size * 1.6

  return (
    <span
      role="img"
      aria-label="WebReceipt"
      className={`relative block shrink-0 overflow-hidden bg-black ${className}`}
      style={{ height, width: height * 4.6 }}
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
    </span>
  )
}
