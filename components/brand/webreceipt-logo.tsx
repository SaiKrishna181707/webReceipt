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
    [-8, -4, -5, .96], [4, -7, 4, .97], [9, -3, 6, .95], [7, 5, 4, .97],
    [-9, 4, -4, .96], [2, 7, 3, .98], [-4, -8, -3, .96], [8, 7, 5, .97],
    [-7, 3, -5, .95], [5, -5, 4, .97], [-6, 6, -4, .96], [9, 2, 6, .95],
  ] as const
  const [tx, ty, rotate, scale] = vectors[index]
  return { col, row, tx, ty, rotate, scale }
})

/**
 * WebReceipt wordmark. Every five seconds the mark briefly breaks into a
 * restrained set of puzzle-like tiles, then locks back into the normal mark.
 * The animation is CSS-only so it stays cheap compared with canvas effects.
 */
export function WebReceiptLogo({ size = 27, className = '' }: LogoProps) {
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
        .wr-logo-puzzle { contain: layout paint; }
        .wr-logo-stage { filter: drop-shadow(0 0 10px rgba(51,255,102,.08)); }
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
          background:linear-gradient(108deg,transparent 32%,rgba(224,255,235,.12) 48%,transparent 62%);
          animation:wr-logo-sheen 5s ease-in-out infinite;
          mix-blend-mode:screen;
        }
        @keyframes wr-logo-puzzle {
          0%,72%,100% { transform:translate3d(0,0,0) rotate(0deg) scale(1); opacity:1; filter:none; }
          78% { transform:translate3d(calc(var(--tx) * 1px),calc(var(--ty) * 1px),0) rotate(var(--rot)) scale(var(--scale)); opacity:.88; filter:brightness(1.15); }
          87% { transform:translate3d(calc(var(--tx) * .45px),calc(var(--ty) * .45px),0) rotate(calc(var(--rot) * .45)) scale(1); opacity:1; }
          94% { transform:translate3d(0,0,0) rotate(0deg) scale(1); opacity:1; filter:none; }
        }
        @keyframes wr-logo-sheen {
          0%,62% { transform:translateX(-130%); opacity:0; }
          72% { opacity:.25; }
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
