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
    [-14, -7, -7, .94], [8, -12, 6, .95], [16, -6, 9, .93], [12, 9, 7, .95],
    [-16, 8, -7, .94], [4, 13, 5, .96], [-9, -14, -5, .94], [14, 13, 8, .95],
    [-13, 6, -8, .93], [9, -10, 6, .95], [-11, 12, -6, .94], [16, 5, 8, .93],
  ] as const
  const [tx, ty, rotate, scale] = vectors[index]
  return { col, row, tx, ty, rotate, scale }
})

/**
 * WebReceipt wordmark. Every five seconds the mark briefly breaks into a
 * restrained set of puzzle-like tiles, then locks back into the normal mark.
 * The animation is CSS-only so it stays cheap compared with canvas effects.
 */
export function WebReceiptLogo({ size = 33, className = '' }: LogoProps) {
  const height = size * 1.6

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
              ['--tx' as string]: tile.tx,
              ['--ty' as string]: tile.ty,
              ['--rot' as string]: `${tile.rotate}deg`,
              ['--scale' as string]: tile.scale,
              animationDelay: `${index * 18}ms`,
            } as React.CSSProperties}
          />
        ))}
      </span>
      <span aria-hidden className="wr-logo-sheen" />
      <style jsx>{`
        .wr-logo-puzzle { contain:layout paint; }
        .wr-logo-stage { filter:drop-shadow(0 0 12px rgba(51,255,102,.10)); }
        .wr-logo-tile {
          position:absolute;
          display:block;
          background-repeat:no-repeat;
          animation:wr-logo-puzzle 5s cubic-bezier(.16,1,.3,1) infinite;
          will-change:transform,opacity,filter;
          transform-origin:center;
        }
        .wr-logo-sheen {
          position:absolute;
          inset:0;
          pointer-events:none;
          background:linear-gradient(108deg,transparent 28%,rgba(224,255,235,.16) 48%,transparent 66%);
          animation:wr-logo-sheen 5s ease-in-out infinite;
          mix-blend-mode:screen;
        }
        @keyframes wr-logo-puzzle {
          0%,70%,100% { transform:translate3d(0,0,0) rotate(0deg) scale(1); opacity:1; filter:none; }
          76% { transform:translate3d(calc(var(--tx) * 1px),calc(var(--ty) * 1px),0) rotate(var(--rot)) scale(var(--scale)); opacity:.78; filter:brightness(1.18); }
          85% { transform:translate3d(calc(var(--tx) * .38px),calc(var(--ty) * .38px),0) rotate(calc(var(--rot) * .38)) scale(1); opacity:1; }
          93% { transform:translate3d(0,0,0) rotate(0deg) scale(1); opacity:1; filter:none; }
        }
        @keyframes wr-logo-sheen {
          0%,58% { transform:translateX(-130%); opacity:0; }
          68% { opacity:.28; }
          88% { transform:translateX(130%); opacity:0; }
          100% { transform:translateX(130%); opacity:0; }
        }
        @media (prefers-reduced-motion:reduce) {
          .wr-logo-tile,.wr-logo-sheen { animation:none; }
        }
      `}</style>
    </span>
  )
}
