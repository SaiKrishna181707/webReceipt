/* ============================================================================
   THE WORDMARK
   WebReceipt set as a periodic-table lockup: the two capitals sit in element
   tiles — tungsten (W, 74) and rhenium (R, 75) — and the lowercase runs
   between them in the same face.

   Clean type, deliberately. No distress filter, no texture asset: the mark has
   to survive a 16px favicon and a hero headline with the same file, and grain
   is the first thing that turns to mud at small sizes.

   Everything is driven by `size` — tiles, capitals and atomic numbers are all
   laid out in `em` from that one number.
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

/** One tile off the table: white rule, forest-green face, capital, number. */
function ElementTile({ symbol, number }: { symbol: string; number: number }) {
  return (
    <span className="wr-tile" aria-hidden>
      <span className="wr-tile-symbol">{symbol}</span>
      <span className="wr-tile-number">{number}</span>
    </span>
  )
}
