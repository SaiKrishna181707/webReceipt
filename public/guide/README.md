# Guide portrait

`GuidePortrait` (`components/matrix/guide-portrait.tsx`) looks for one file:

```
public/guide/guide.png
```

If it is present it is used automatically — no code change, no import. If it is
missing or 404s, the component falls back to an abstract figure resolved out of
falling code, drawn inline as SVG.

## Included asset

`guide.png` is an original, non-identifiable operator portrait created for the
Matrix-inspired opening. It preserves the requested dark, tactical mood without
copying a real actor or television image.

## What the layout expects

- The floating guide uses a roughly **1 : 1.28** crop with `object-fit: cover`
  and `object-position: top`. The opening sequence uses the full **2 : 3**
  figure with `object-fit: contain`.
- Useful source size: **240 × 307** or larger. Anything smaller will soften on
  high-DPI screens.
- Transparent or dark background. The component grades the image toward the
  Matrix palette (grayscale, green hue-rotate, darkened) and lays phosphor
  scanlines plus a top-left key light over it, so a neutral, evenly lit source
  composites best.
- PNG. The path is hard-coded as `guide.png`; to use a different format, change
  `PORTRAIT_SRC` in `guide-portrait.tsx`.

The portrait is decorative — it renders with `alt=""` and the guide's actual
message is real text. If the image cannot load, it degrades cleanly to the
procedural code-figure fallback.
