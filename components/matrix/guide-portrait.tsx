/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'

/* ============================================================================
   THE GUIDE'S PORTRAIT

   Two-stage render, and the reason is worth stating plainly.

   The brief references a photographic television character. The shipped artwork
   instead is an original, non-identifiable operator created for this product;
   it captures the requested mood without copying a real actor or show image.

   `public/guide/guide.png` is used automatically at the size and crop the
   layout expects. If it is ever unavailable, the fallback renders a figure
   resolved out of falling code, so the opening still works without its asset.
   ========================================================================== */

const PORTRAIT_SRC = '/guide/guide.png'
/** Remembered across mounts and navigations so a missing portrait costs one
    request per session, not one per render of the guide. */
const MISS_KEY = 'wr.guide.portrait.missing.v1'

function knownMissing(): boolean {
  try {
    return sessionStorage.getItem(MISS_KEY) === '1'
  } catch {
    return false
  }
}

export function GuidePortrait({
  size = 76,
  className = '',
  /** Adds the slow arrival scan used by the opening sequence. */
  cinematic = false,
  /** The opening sequence uses the complete figure rather than a face crop. */
  fullFigure = false,
}: {
  size?: number
  className?: string
  cinematic?: boolean
  fullFigure?: boolean
}) {
  const [failed, setFailed] = useState(false)

  // Server render has no sessionStorage, so the check has to happen after mount.
  useEffect(() => {
    if (knownMissing()) setFailed(true)
  }, [])

  const onMissing = () => {
    setFailed(true)
    try {
      sessionStorage.setItem(MISS_KEY, '1')
    } catch {
      /* Private mode: fall back every time rather than break the render. */
    }
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[2px] border border-matrix-400/25 bg-black ${className}`}
      style={{ width: size, height: size * (fullFigure ? 1.5 : 1.28) }}
    >
      {failed ? (
        <CodeFigure />
      ) : (
        <img
          src={PORTRAIT_SRC}
          alt=""
          width={size}
          height={Math.round(size * 1.28)}
          onError={onMissing}
          className={`h-full w-full ${fullFigure ? 'object-contain object-bottom' : 'object-cover object-top'}`}
          style={{ filter: 'grayscale(0.55) contrast(1.12) brightness(0.82) sepia(0.18) hue-rotate(72deg)' }}
        />
      )}

      {/* Phosphor lines over whichever portrait rendered, so the photo and the
          fallback sit in the same environment. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.5) 0 1px, transparent 1px 3px)',
          opacity: 0.34,
        }}
      />
      {/* Light falls from the upper left; the rest of the figure stays in the dark. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(78% 58% at 28% 16%, rgba(51,255,102,.16), transparent 62%), linear-gradient(180deg, transparent 42%, rgba(0,0,0,.86) 100%)',
        }}
      />
      {cinematic && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-scan"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(51,255,102,.55), transparent)',
            opacity: 0.5,
          }}
        />
      )}
    </div>
  )
}

/** The fallback: a head-and-shoulders figure made of vertical code. */
function CodeFigure() {
  return (
    <svg viewBox="0 0 120 154" className="h-full w-full" aria-hidden>
      <defs>
        <clipPath id="wr-guide-figure">
          <ellipse cx="60" cy="44" rx="25" ry="30" />
          <rect x="51" y="66" width="18" height="24" />
          <path d="M8 154C11 112 34 90 51 84h18c17 6 40 28 43 70Z" />
        </clipPath>
        <linearGradient id="wr-guide-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b602b" stopOpacity="0.95" />
          <stop offset="58%" stopColor="#04240f" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#000000" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect width="120" height="154" fill="#000" />

      <g clipPath="url(#wr-guide-figure)">
        <rect width="120" height="154" fill="url(#wr-guide-fade)" />
        {/* Vertical streaks — the figure is only visible where code passes through it. */}
        {Array.from({ length: 17 }, (_, i) => {
          const x = 5 + i * 7
          const top = (i * 23) % 70
          return (
            <line
              key={x}
              x1={x}
              y1={top}
              x2={x}
              y2={top + 60 + ((i * 13) % 50)}
              stroke="#33ff66"
              strokeWidth="1.6"
              opacity={0.1 + ((i * 7) % 5) * 0.055}
            />
          )
        })}
        {/* A brighter run, to keep it from reading as a flat texture. */}
        <line x1="47" y1="12" x2="47" y2="120" stroke="#7bffa0" strokeWidth="1.4" opacity="0.32" />
        <line x1="82" y1="30" x2="82" y2="146" stroke="#7bffa0" strokeWidth="1.4" opacity="0.22" />
      </g>

      {/* Rim light along the edge of the figure. */}
      <g clipPath="url(#wr-guide-figure)">
        <ellipse cx="60" cy="44" rx="25" ry="30" fill="none" stroke="#33ff66" strokeWidth="1.5" opacity="0.5" />
        <path d="M8 154C11 112 34 90 51 84h18c17 6 40 28 43 70Z" fill="none" stroke="#33ff66" strokeWidth="1.5" opacity="0.42" />
      </g>
    </svg>
  )
}
