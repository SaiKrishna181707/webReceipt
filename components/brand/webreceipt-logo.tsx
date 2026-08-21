/* ============================================================================
   THE WORDMARK

   WebReceipt set as a periodic-table lockup: the two capitals sit in element
   tiles — tungsten (W, 74) and rhenium (Re, 75) — with the lowercase running
   between them.

   Symbol and atomic number, and nothing else. No atomic mass, no electron
   shells: at 19px in a header those rows are illegible noise, and they were
   what crowded the tile. All geometry lives in `.wr-tile*` in globals.css, so
   one `size` scales the whole lockup from a favicon to a hero.
   ========================================================================== */

interface LogoProps {
  /** Root font-size in px. The whole lockup is laid out in `em` from here. */
  size?: number
  /** Lets one tile flicker like a failing ballast. Home page only. */
  flicker?: boolean
  className?: string
}

export function WebReceiptLogo({ size = 21, flicker = false, className = '' }: LogoProps) {
  return (
    <span role="img" aria-label="WebReceipt" className={`wr-logo ${className}`} style={{ fontSize: size }}>
      <ElementTile symbol="W" number={74} />
      <span className="wr-word" aria-hidden>
        eb
      </span>

      <ElementTile symbol="R" number={75} flicker={flicker} />
      <span className="wr-word" aria-hidden>
        eceipt
      </span>
    </span>
  )
}

/**
 * Periodic-table tile:
 *
 *              74
 *              W
 */
function ElementTile({ symbol, number, flicker = false }: { symbol: string; number: number; flicker?: boolean }) {
  return (
    <span className={`wr-tile ${flicker ? 'wr-flicker' : ''}`} style={{ fontSize: '1.45em' }} aria-hidden>
      <span className="wr-tile-number">{number}</span>
      <span className="wr-tile-symbol">{symbol}</span>
    </span>
  )
}
