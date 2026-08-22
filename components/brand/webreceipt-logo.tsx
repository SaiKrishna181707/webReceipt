'use client'

interface LogoProps {
  size?: number
  flicker?: boolean
  className?: string
}

const ARTWORK = '/ChatGPT_Image_Aug_21,_2026,_10_14_22_AM.png'

/** Static Breaking Bad-style WebReceipt wordmark. */
export function WebReceiptLogo({ size = 54, className = '' }: LogoProps) {
  const height = size * 1.05

  return (
    <span
      role="img"
      aria-label="WebReceipt"
      className={`relative block shrink-0 overflow-visible ${className}`}
      style={{ height, width: height * 1.5 }}
    >
      <img
        src={ARTWORK}
        alt="WebReceipt"
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain object-left"
        style={{ filter: 'drop-shadow(0 0 12px rgba(51,255,102,.12))' }}
      />
    </span>
  )
}
