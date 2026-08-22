'use client'

interface LogoProps {
  size?: number
  flicker?: boolean
  className?: string
}

const ARTWORK = '/ChatGPT_Image_Aug_21,_2026,_10_14_22_AM.png'

const TILES = Array.from({ length: 12 }, (_, index) => {
  const col = index % 4
  const row = Math.floor(index / 4)
  const vectors = [
    [-16, -8, -8, .94], [9, -13, 7, .95], [18, -7, 10, .93], [13, 10, 8, .95],
    [-18, 9, -8, .94], [5, 15, 6, .96], [-10, -15, -6, .94], [16, 15, 9, .95],
    [-15, 7, -9, .93], [10, -12, 7, .95], [-12, 14, -7, .94], [18, 6, 9, .93],
  ] as const
  const [tx, ty, rotate, scale] = vectors[index]
  return { col, row, tx, ty, rotate, scale }
})

/** Static Breaking Bad-style WebReceipt wordmark. */
export function WebReceiptLogo({ size = 54, className = '' }: LogoProps) {
  const height = size * 1.48

  return (
    <span
      role="img"
      aria-label="WebReceipt"
      className={`wr-logo-puzzle relative block shrink-0 overflow-visible ${className}`}
      style={{ height, width: height * 4.6 }}
    >
      <span className="wr-logo-stage absolute inset-0">
        {TILES.map((tile, index) => (
          <span
            key={index}
            aria-hidden
            className="wr-logo-tile"
            style={{
              width: '25%',
              height: '33.3333%',
              left: `${tile.col * 25}%`,
              top: `${tile.row * 33.3333}%`,
              backgroundImage: `url("${ARTWORK}")`,
              backgroundSize: '400% 300%',
              backgroundPosition: `${tile.col * 33.3333}% ${tile.row * 50}%`,
            } as React.CSSProperties}
          />
        ))}
      </span>
      <style jsx>{`
        .wr-logo-puzzle { contain:layout paint; }
        .wr-logo-stage {
          transform:scale(1.08);
          transform-origin:left center;
          filter:drop-shadow(0 0 16px rgba(51,255,102,.14));
        }
        .wr-logo-tile {
          position:absolute;
          display:block;
          background-repeat:no-repeat;
        }
      `}</style>
    </span>
  )
}
