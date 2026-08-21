/* ============================================================================
   THE WORDMARK
   WebReceipt set as a periodic-table lockup: the two capitals sit in element
   tiles — tungsten (W, 74) and rhenium (R, 75) — and the lowercase runs
   between them in the same face.

   The element tiles are intentionally larger than the lowercase letters so
   the W/R read as the visual anchors of the wordmark, matching the reference
   lockup while keeping the complete wordmark tight and seamless.
   ========================================================================== */

interface LogoProps {
  /** Root font-size in px. The whole lockup is laid out in `em` from here. */
  size?: number
  className?: string
}

export function WebReceiptLogo({ size = 21, className = '' }: LogoProps) {
  return (
    <span role="img" aria-label="WebReceipt" className={`wr-logo ${className}`} style={{ fontSize: size }}>
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

/** One enlarged tile off the periodic table: white rule, forest-green face. */
function ElementTile({ symbol, number }: { symbol: string; number: number }) {
  return (
    <span className="wr-tile" style={{ fontSize: '1.45em' }} aria-hidden>
      <span className="wr-tile-symbol">{symbol}</span>
      <span
        className="wr-tile-number"
        style={{ fontSize: '0.17em', top: '7%', right: '8%' }}
      >
        {number}
      </span>
    </span>
  )
}
