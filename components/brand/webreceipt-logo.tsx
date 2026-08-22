'use client'

interface LogoProps {
  size?: number
  flicker?: boolean
  className?: string
}

/** Clean WebReceipt wordmark: a receipt/document mark plus a crisp text lockup. */
export function WebReceiptLogo({ size = 39, className = '' }: LogoProps) {
  const iconSize = size * 1.45

  return (
    <span
      role="img"
      aria-label="WebReceipt"
      className={`group/wr-logo inline-flex shrink-0 items-center gap-2.5 ${className}`}
      style={{ height: iconSize }}
    >
      <span
        aria-hidden
        className="relative grid shrink-0 place-items-center overflow-hidden rounded-[3px] border border-matrix-400/70 bg-black shadow-[0_0_18px_rgba(51,255,102,.12)]"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full" fill="none">
          <path d="M11 5.5h21l5 5v31H11z" stroke="currentColor" strokeWidth="1.6" className="text-matrix-400" />
          <path d="M32 5.5v6h5" stroke="currentColor" strokeWidth="1.6" className="text-matrix-400" />
          <path d="M16 20h16M16 25h16M16 30h10" stroke="currentColor" strokeWidth="1.5" className="text-matrix-400/55" />
        </svg>
        <span className="relative z-[1] font-mono text-[22px] font-extrabold leading-none text-void-50">W</span>
        <span className="absolute right-[5px] top-[3px] font-mono text-[7px] font-semibold tracking-tight text-matrix-300">74</span>
        <span className="absolute bottom-0 left-0 h-[2px] w-full bg-matrix-400 shadow-[0_0_8px_rgba(51,255,102,.8)]" />
      </span>

      <span className="flex min-w-0 flex-col leading-none">
        <span className="whitespace-nowrap font-sans text-[24px] font-bold tracking-[-0.055em] text-void-50 sm:text-[26px]">
          Web<span className="text-matrix-400">Receipt</span>
        </span>
        <span className="mt-1 whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.22em] text-void-400 sm:text-[8px]">
          Evidence you can trust.
        </span>
      </span>
    </span>
  )
}
