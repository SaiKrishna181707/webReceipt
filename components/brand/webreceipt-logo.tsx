'use client'

interface LogoProps {
  size?: number
  flicker?: boolean
  className?: string
}

/**
 * Breaking-Bad-inspired periodic-table wordmark with a neon phosphor treatment.
 * The entire mark is rendered as inline SVG so it stays sharp at every size.
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
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="wrNeon" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feFlood floodColor="#33ff66" floodOpacity="0.95" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="wrNeonSoft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feFlood floodColor="#33ff66" floodOpacity="0.42" />
            <feComposite in2="blur" operator="in" />
          </filter>
        </defs>

        <style>{`
          .wr-tile {
            fill: rgba(0, 8, 3, .88);
            stroke: #33ff66;
            stroke-width: 3;
          }
          .wr-tile-glow {
            fill: none;
            stroke: #33ff66;
            stroke-width: 8;
            opacity: .38;
            filter: url(#wrNeonSoft);
          }
          .wr-symbol {
            font-family: Georgia, 'Times New Roman', serif;
            font-weight: 700;
            fill: #f1fff5;
            filter: url(#wrNeon);
          }
          .wr-word {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 70px;
            font-weight: 600;
            fill: #f1fff5;
            letter-spacing: -3px;
          }
          .wr-atomic {
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            font-size: 13px;
            font-weight: 600;
            fill: #65ff88;
          }
          .wr-logo {
            transform-origin: 320px 63px;
          }
          .webreceipt-logo-live .wr-logo {
            animation: wrBreath 4.8s ease-in-out infinite;
          }
          .webreceipt-logo-live .wr-tile-glow {
            animation: wrGlow 4.8s ease-in-out infinite;
          }
          .webreceipt-logo-live .wr-word {
            animation: wrFlicker 7.5s steps(1,end) infinite;
          }
          @keyframes wrBreath {
            0%,100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-1px) scale(1.006); }
          }
          @keyframes wrGlow {
            0%,100% { opacity: .28; }
            50% { opacity: .7; }
          }
          @keyframes wrFlicker {
            0%, 92%, 100% { opacity: 1; }
            93% { opacity: .82; }
            94% { opacity: 1; }
            96% { opacity: .72; }
            97% { opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            .webreceipt-logo-live .wr-logo,
            .webreceipt-logo-live .wr-tile-glow,
            .webreceipt-logo-live .wr-word {
              animation: none;
            }
          }
        `}</style>

        <g className="wr-logo">
          <rect className="wr-tile-glow" x="3" y="3" width="118" height="118" rx="1" />
          <rect className="wr-tile" x="6" y="6" width="112" height="112" rx="1" filter="url(#wrNeon)" />
          <text className="wr-atomic" x="94" y="21" textAnchor="end">74</text>
          <text className="wr-symbol" x="62" y="91" fontSize="72" textAnchor="middle">W</text>

          <text className="wr-word" x="128" y="91">eb</text>

          <rect className="wr-tile-glow" x="226" y="3" width="118" height="118" rx="1" />
          <rect className="wr-tile" x="229" y="6" width="112" height="112" rx="1" filter="url(#wrNeon)" />
          <text className="wr-atomic" x="317" y="21" textAnchor="end">75</text>
          <text className="wr-symbol" x="285" y="91" fontSize="72" textAnchor="middle">R</text>

          <text className="wr-word" x="349" y="91">eceipt</text>
        </g>
      </svg>
    </span>
  )
}
