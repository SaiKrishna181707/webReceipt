/* ============================================================================
   THE WORDMARK
   WebReceipt set as a periodic-table lockup: the two capitals sit in element
   tiles — tungsten (W, 74) and rhenium (Re, 75) — with real periodic-table
   metadata and the lowercase wordmark running between them.

   The tile layout follows the familiar Breaking Bad / periodic-table visual:
   atomic mass in the upper-left, atomic number in the upper-right, symbol in
   the center, and electron-shell configuration along the bottom.
   ========================================================================== */

interface LogoProps {
  /** Root font-size in px. The whole lockup is laid out in `em` from here. */
  size?: number
  className?: string
}

export function WebReceiptLogo({ size = 21, className = '' }: LogoProps) {
  return (
    <span role="img" aria-label="WebReceipt" className={`wr-logo ${className}`} style={{ fontSize: size }}>
      <ElementTile
        symbol="W"
        number={74}
        mass="183.84"
        electrons="2-8-18-32-12-6"
      />
      <span className="wr-word" aria-hidden>
        eb
      </span>

      <ElementTile
        symbol="R"
        number={75}
        mass="186.21"
        electrons="2-8-18-32-13-2"
      />
      <span className="wr-word" aria-hidden>
        eceipt
      </span>
    </span>
  )
}

/**
 * Periodic-table tile:
 *   mass        atomic number
 *
 *             SYMBOL
 *
 *   electron-shell configuration
 */
function ElementTile({
  symbol,
  number,
  mass,
  electrons,
}: {
  symbol: string
  number: number
  mass: string
  electrons: string
}) {
  return (
    <span
      className="wr-tile"
      style={{
        position: 'relative',
        fontSize: '1.45em',
        lineHeight: 1,
      }}
      aria-hidden
    >
      <span
        className="wr-tile-mass"
        style={{
          position: 'absolute',
          top: '7%',
          left: '8%',
          fontSize: '0.22em',
          lineHeight: 1,
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        {mass}
      </span>

      <span
        className="wr-tile-number"
        style={{
          position: 'absolute',
          top: '7%',
          right: '8%',
          fontSize: '0.22em',
          lineHeight: 1,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {number}
      </span>

      <span
        className="wr-tile-symbol"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-block',
          marginTop: '5%',
          fontSize: '0.9em',
          lineHeight: 1,
        }}
      >
        {symbol}
      </span>

      <span
        className="wr-tile-electrons"
        style={{
          position: 'absolute',
          bottom: '7%',
          left: '8%',
          fontSize: '0.16em',
          lineHeight: 1,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {electrons}
      </span>
    </span>
  )
}
