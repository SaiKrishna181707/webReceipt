/* ============================================================================
   THE WORDMARK

   Two periodic-table tiles carrying the capitals — tungsten (W, 74) and rhenium
   (Re, 75) — with the lowercase running between them: W-eb-Re-ceipt.

   The lockup is CSS, not an image. Every dimension in `.wr-logo` and its children
   is expressed in `em`, so a single `font-size` scales the whole thing: 21px in
   the nav, 30px in the hero, 20px in the footer, all from the same rules. That is
   also why it needs no `next/image`, no intrinsic size, and no crop offsets.

   See `app/globals.css` → "THE WORDMARK" for the tile geometry.
   ========================================================================== */

interface LogoProps {
  /** Root font-size in px. Every part of the lockup scales from it. */
  size?: number
  /** Flickers the second tile occasionally, like a failing ballast. */
  flicker?: boolean
  className?: string
}

export function WebReceiptLogo({ size = 21, flicker = false, className = '' }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="WebReceipt"
      className={`wr-logo shrink-0 ${className}`.trim()}
      style={{ fontSize: size }}
    >
      {/* aria-hidden throughout: the label above already reads "WebReceipt", and
          without this a screen reader would announce "W 74 eb Re 75 ceipt". */}
      <span aria-hidden className="wr-tile">
        <span className="wr-tile-number">74</span>
        <span className="wr-tile-symbol">W</span>
      </span>
      <span aria-hidden className="wr-word">
        eb
      </span>
      <span aria-hidden className={`wr-tile ${flicker ? 'wr-flicker' : ''}`.trim()}>
        <span className="wr-tile-number">75</span>
        <span className="wr-tile-symbol">Re</span>
      </span>
      <span aria-hidden className="wr-word wr-word-accent">
        ceipt
      </span>
    </span>
  )
}
