'use client'

interface LogoProps {
  size?: number
  flicker?: boolean
  className?: string
}

/**
 * Inline SVG wordmark inspired by the Breaking Bad periodic-table treatment.
 * Nothing is loaded as an image: the entire mark is part of the DOM/SVG tree,
 * so it stays crisp at every size and can animate independently.
 */
export function WebReceiptLogo({ size = 54, flicker = true, className = '' }: LogoProps) {
  const height = size * 0.88
  const width = height * 4.45

  return (
    <span
      role="img"
      aria-label="WebReceipt"
      className={`webreceipt-logo relative block shrink-0 ${flicker ? 'webreceipt-logo-live' : ''} ${className}`}
      style={{ height, width }}
    >
      <svg
        viewBox="0 0 640 126"
        width="100%"
        height="100%"
        viewBox="0 0 640 126"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <style>{`
          .wr-tile { fill: rgba(44, 128, 61, .9); stroke: rgba(225,255,232,.95); stroke-width: 2.5; }
          .wr-tile-glow { fill: none; stroke: rgba(51,255,102,.42); stroke-width: 5; opacity: .35; }
          .wr-symbol { font-family: Georgia, 'Times New Roman', serif; font-weight: 700; fill: #f4fff6; }
          .wr-word { font-family: Georgia, 'Times New Roman', serif; font-size: 70px; font-weight: 600; fill: #f4fff6; letter-spacing: -3px; }
          .wr-detail { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; fill: rgba(241,255,244,.9); }
          .wr-atomic { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; fill: rgba(241,255,244,.92); }
          .wr-logo { transform-origin: 320px 63px; }
          .webreceipt-logo-live .wr-logo { animation: wrBreath 4.8s ease-in-out infinite; }
          .webreceipt-logo-live .wr-tile-glow { animation: wrGlow 4.8s ease-in-out infinite; }
          .webreceipt-logo-live .wr-word { animation: wrFlicker 7.5s steps(1,end) infinite; }
          @keyframes wrBreath { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-1px) scale(1.006); } }
          @keyframes wrGlow { 0%,100% { opacity:.2; } 50% { opacity:.58; } }
          @keyframes wrFlicker { 0%, 92%, 100% { opacity:1; } 93% { opacity:.82; } 94% { opacity:1; } 96% { opacity:.72; } 97% { opacity:1; } }
          @media (prefers-reduced-motion: reduce) { .webreceipt-logo-live .wr-logo, .webreceipt-logo-live .wr-tile-glow, .webreceipt-logo-live .wr-word { animation: none; } }
        `}</style>

        <g className="wr-logo">
          <rect className="wr-tile-glow" x="3" y="3" width="118" height="118" rx="1" />
          <rect className="wr-tile" x="6" y="6" width="112" height="112" rx="1" />
          <text className="wr-atomic" x="94" y="21" textAnchor="end">74</text>
          <text className="wr-symbol" x="62" y="91" fontSize="72" textAnchor="middle">W</text>
          <text className="wr-atomic" x="18" y="105">2-8-18-7</text>

          <text className="wr-word" x="128" y="91">eb</text>

          <rect className="wr-tile-glow" x="226" y="3" width="118" height="118" rx="1" />
          <rect className="wr-tile" x="229" y="6" width="112" height="112" rx="1" />
          <text className="wr-atomic" x="317" y="21" textAnchor="end">75</text>
          <text className="wr-symbol" x="285" y="91" fontSize="72" textAnchor="middle">R</text>
          <text className="wr-atomic" x="241" y="105">2-8-18-7</text>

          <text className="wr-word" x="349" y="91">eceipt</text>
        </g>
      </svg>
    </span>
  )
}
