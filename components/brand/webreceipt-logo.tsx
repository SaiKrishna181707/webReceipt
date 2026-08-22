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

/** WebReceipt wordmark. Every five seconds the mark briefly separates into puzzle-like tiles, then locks back in. */
export function WebReceiptLogo({ size = 39, className = '' }: LogoProps) {
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
              ['--tx' as string]: tile.tx,
              ['--ty' as string]: tile.ty,
              ['--rot' as string]: `${tile.rotate}deg`,
              ['--scale' as string]: tile.scale,
              animationDelay: `${index * 16}ms`,
            } as React.CSSProperties}
          />
        ))}
      </span>
      <span aria-hidden className="wr-logo-sheen" />
      <style jsx>{`
        .wr-logo-puzzle { contain:layout paint; }
        .wr-logo-stage { transform:scale(1.04); transform-origin:left center; filter:drop-shadow(0 0 14px rgba(51,255,102,.12)); }
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
          background:linear-gradient(108deg,transparent 24%,rgba(224,255,235,.20) 48%,transparent 70%);
          animation:wr-logo-sheen 5s ease-in-out infinite;
          mix-blend-mode:screen;
        }
        @keyframes wr-logo-puzzle {
          0%,68%,100% { transform:translate3d(0,0,0) rotate(0deg) scale(1); opacity:1; filter:none; }
          74% { transform:translate3d(calc(var(--tx) * 1px),calc(var(--ty) * 1px),0) rotate(var(--rot)) scale(var(--scale)); opacity:.72; filter:brightness(1.22); }
          83% { transform:translate3d(calc(var(--tx) * .34px),calc(var(--ty) * .34px),0) rotate(calc(var(--rot) * .34)) scale(1); opacity:1; }
          92% { transform:translate3d(0,0,0) rotate(0deg) scale(1); opacity:1; filter:none; }
        }
        @keyframes wr-logo-sheen {
          0%,56% { transform:translateX(-130%); opacity:0; }
          66% { opacity:.32; }
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
