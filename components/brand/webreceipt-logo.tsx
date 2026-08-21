/* ============================================================================
   WEBRECEIPT WORDMARK
   W and R use enlarged periodic-table tiles. Only the atomic numbers are
   shown, keeping the lockup clean and readable.
   ========================================================================== */

interface LogoProps {
  size?: number
  className?: string
}

export function WebReceiptLogo({ size = 21, className = '' }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="WebReceipt"
      className={`wr-logo ${className}`}
      style={{ fontSize: size }}
    >
      <ElementTile symbol="W" number={74} />
      <span className="wr-word" aria-hidden>
        eb
      </span>

      <ElementTile symbol="R" number={75} />
      <span className="wr-word" aria-hidden>
        eceipt
      </span>
    </span>
  )
}

function ElementTile({
  symbol,
  number,
}: {
  symbol: string
  number: number
}) {
  return (
    <span
      className="wr-tile"
      aria-hidden
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.45em',
        lineHeight: 1,
      }}
    >
      <span
        className="wr-tile-symbol"
        style={{
          display: 'block',
          fontSize: '0.72em',
          lineHeight: 1,
          transform: 'translateY(0.04em)',
        }}
      >
        {symbol}
      </span>

      <span
        className="wr-tile-number"
        style={{
          position: 'absolute',
          top: '0.08em',
          right: '0.08em',
          fontSize: '0.14em',
          lineHeight: 1,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {number}
      </span>
    </span>
  )
}
