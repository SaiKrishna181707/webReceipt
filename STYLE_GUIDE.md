# WebReceipt Style Guide — **Ocean Drive**

The interface is a stretch of Miami boulevard at 19:04, sometime in 1986. Everything
on screen is either a **lit sign**, the **chrome** it's bolted to, or the **dusk** behind
it. There is no flat grey card anywhere in the product.

Two rules carry the whole system:

1. **Colour means state, never decoration.** Mint is valid, blood is broken, gold is
   the house voice, aqua is provenance, violet is time. If a surface glows a colour, it
   is asserting something.
2. **Nothing is an image.** Every visual — sunset, neon, palms, Art Deco towers, cars,
   the CRT scanlines — is procedural: CSS gradients, inline SVG, three.js geometry, or
   GLSL. No Rockstar/GTA art or any other third-party asset ships in this repo, so the
   look is legally clean for submission and there is nothing to license.

---

## 1. Palette

Defined once in [tailwind.config.ts](tailwind.config.ts) and mirrored as CSS variables in
[app/globals.css](app/globals.css). Each scale runs 200 → 800; `night` runs 100 → 900.
The **signature stop** below is the one the glow hexes are keyed to — note it is not
always `400`, so copy the stop, not just the family name.

| Token | Signature stop | What it's allowed to mean |
| --- | --- | --- |
| `neon` | `500` · `#ff2e97` | Flamingo neon. Primary brand, primary CTA, self-healing. |
| `aqua` | `400` · `#2de2e6` | Pool aqua. Evidence, provenance, captured data, GET routes. |
| `gold` | `400` · `#ffc23c` | The sun. Kickers, the house voice, the contract board, POST routes. |
| `mint` | `400` · `#35f39a` | Pool tile green. **Valid / healed / passing / added.** |
| `blood` | `500` · `#ff2d5e` | Scarface red. **Invalid / broken tube / failing / removed.** |
| `sunset` | `500` · `#ff7418` | Horizon orange. In-flight, healing, "not settled yet". |
| `violet` | `400` · `#8b4dff` | Dusk sky. Time, diffing, deep panel shadow. Lit as `300` (`#b184ff`). |
| `night` | `900` · `#0a0510` | Chrome → night. `100` (`#f6f3ff`) is body text, `900` is the page. |

`violet` deliberately shadows Tailwind's built-in violet, so `violet-*` anywhere in this
repo is the dusk scale, and there is no `violet-50/100/900`.

Legacy aliases (`brick→neon`, `stud→gold`, `azure→aqua`, `lime→mint`, `rose→blood`,
`plate→night`, `tangerine→sunset`, `amber→gold`, `vice→violet`) are kept **only** so no
surface can fall back to an off-theme Tailwind default. Do not write new code against
them — all first-party call sites have been migrated.

### Backgrounds and shadows

The page backdrop is not a utility class — it is `.vice-body::before` / `::after`, applied
once to `<body>` in [app/layout.tsx](app/layout.tsx) and fixed behind everything at
`z-index: -2 / -1`. `::before` is the dusk sky plus a gold horizon bloom, a flamingo haze
on the left and pool light on the right; `::after` is a pure-CSS perspective grid running
to the vanishing point, masked out as it rises. Pages never paint their own background.

- `bg-neon-rule` — a tube running magenta → gold → aqua, transparent at both ends. Used
  for the navigation underline.
- `shadow-neon` / `shadow-aqua` / `shadow-gold` — hairline ring + near halo + far bloom.
- `shadow-chrome` — hot top edge, dark underside, long dusk shadow. For trim, not signs.
- `shadow-deco` — the facade shadow: inset highlight, deep drop, faint magenta spill.
- `bg-sunset-sky` (seven-stop dusk gradient) and `bg-chrome` (specular flip at the midline)
  are defined in the config and available, but **currently unused** — `.vice-body` covers
  the sky, and chrome ships through `shadow-chrome` and the `chrome` control tone. Reach
  for them for a full-bleed panel rather than hand-rolling a new gradient.

---

## 2. Typography

Loaded in [app/globals.css](app/globals.css).

| Role | Family | Usage |
| --- | --- | --- |
| `font-display` / `.display` | **Kanit** | All headings. **Always italic** — the italic is where the 80s speed comes from. |
| `font-neon` / `.tube` | **Monoton** | Wordmarks only. Never body copy, never more than four words. |
| `font-mono` | **Fira Code** | Kickers, hashes, labels, data, code. |

All three arrive through a single Google Fonts `@import` at the top of
[app/globals.css](app/globals.css) (Kanit + Monoton + Fira Code + Inter, `display=swap`).
That `@import` is a blocking request chain — the honest trade-off for a look that depends
on real display faces. Text still paints immediately in the fallback and swaps, and Inter
is bundled as the sans fallback behind Kanit. If first paint ever needs to get tighter,
move this to `next/font` and self-host; nothing else in the system would change.

Body copy is `text-night-200` at 15–17px. Kickers are the signature:
`font-mono text-[11px] uppercase tracking-[0.26em] text-gold-400`.

### Text treatments

`.neon-text` (+ `-aqua`, `-gold` variants), `.chrome-text`, `.sunset-text`,
`.outline-text`. `.neon-text` layers exactly four shadows to fake a glass tube — a tight
white core, two mid glows, and a wide bloom — so use it on at most one line per screen,
paired with `.chrome-text` on the line above or below.

The variants are not separate rules: they only reassign `--tube` and `--tube-far`, so any
element can be lit an arbitrary colour with
`className="neon-text" style={{ ['--tube']: c, ['--tube-far']: `${c}a0` }}`.

---

## 3. Components

### CSS kit — [components/vice/vice-ui.tsx](components/vice/vice-ui.tsx)

| Component | Notes |
| --- | --- |
| `NeonButton` / `NeonLink` | A lit sign you can press. `tone` ∈ 7 tones, `size` ∈ sm/md/lg, `variant` ∈ outline/solid. On `:active` the tube dims and the sign sinks into its bracket. |
| `DecoPanel` | An Art Deco facade. Tracks the pointer and banks ±4.5° on both axes with a 14px lift, so the parapet travels across the front. `tilt={false}` for consoles and dense data; `corner={false}` drops the stepped corner. |
| `TubeRail` | A run of tube segments that brightens left→right. Rule, divider, or step track. |
| `Reveal` | IntersectionObserver fade-up, `delay` in ms for staggering grids. |
| `SunDisc` | The banded setting sun; bars crawl upward. |
| `BoulevardTicker` | Endless marquee of lit storefront signs, drawn from inline SVG glyphs. |

The seven tones are `neon`, `aqua`, `gold`, `mint`, `blood`, `violet`, `chrome` — exported
as the `ViceTone` type, with the raw hexes available as `viceTones` when a surface needs to
derive its own glow. **There is no `sunset` control tone**; sunset is a palette colour used
for in-flight state via inline style, not a button variant.

Each tone is five values (`tube`, `glow`, `face`, `solid`, `ink`) piped into the CSS as
`--btn-tube` / `--btn-glow` / `--btn-face` / `--btn-solid` / `--btn-ink`, which is why
`.neon-btn` is one class rather than seven.

### Utility classes — [app/globals.css](app/globals.css)

`.deco-panel` / `.deco-corner` / `.deco-lift` · `.neon-btn` / `.neon-btn-solid` ·
`.neon-rule` / `.chrome-rule` · `.sun-disc` · `.hud-meter` (drive with `--meter: <hex>`) ·
`.scene-3d` / `.card-3d` / `.tilt-3d` · `.reveal` / `.reveal-in` ·
`.crt-overlay` / `.crt-vignette` (mounted once in the root layout, `aria-hidden`).

Motion utilities: `animate-marquee`, `animate-flicker` (a failing ballast),
`animate-neon-pulse`, `animate-sway` (palms), `animate-sun-bars`, `animate-scan`,
`animate-drive-by`, `animate-float`, `animate-fade-in-up`, plus the globals-only
`animate-pulse-glow`, `animate-tube-flicker`, `animate-shimmer`, `animate-border-glow`.

### Geometry

Radii are **2px**, not 8px — Art Deco is machined, not soft. The only round things are
bulbs (`rounded-full`) and tube ends.

### Product components — [components/product/](components/product)

Eight, and only eight. Each is a themed view over a slice of the engine's output; none of
them own state beyond local UI.

| File | Reads | Lit as |
| --- | --- | --- |
| `deal-contract-card.tsx` | the compiled contract | gold price board |
| `integrity-panel.tsx` | integrity checks + score | mint/blood, with a `hud-meter` |
| `anomalies-panel.tsx` | anomaly list | gold noticeboard, per-severity tubes |
| `promise-diff.tsx` | two observations | violet header, mint adds / blood removes |
| `heal-console.tsx` | the repair timeline | mint when healed, sunset while in flight |
| `journey-replay.tsx` | collector steps | a run of bulbs, gold → blood → sunset |
| `event-log.tsx` | the event stream | a 1986 CRT with phosphor scanlines |
| `evidence-drawer.tsx` | raw captured evidence | mint-tube drawer, aqua capture text |

That is the whole component library, plus the vice kit above, the three.js layer below, and
[components/navigation.tsx](components/navigation.tsx) — the chrome header, underlined with
a `bg-neon-rule` tube. There is no design-system `ui/` directory, no gamification, no XP or
achievements, no voice navigation, no natural-language search, no WebSocket presence, and
no sidebar — earlier revisions of this document described all of those, and none of them
ever existed here.

### Pages

Five: [app/page.tsx](app/page.tsx) (the strip),
[app/console/page.tsx](app/console/page.tsx) (run a URL through the pipeline),
[app/mutation-lab/page.tsx](app/mutation-lab/page.tsx) (blood-toned chaos switchboard),
[app/receipts/page.tsx](app/receipts/page.tsx) (the ledger),
[app/docs/page.tsx](app/docs/page.tsx). Plus `app/loading.tsx`, a themed skeleton.

---

## 4. The 3D layer

three.js via `@react-three/fiber` — no postprocessing package, by design (see below). All
primitives live in [components/three/vice-kit.tsx](components/three/vice-kit.tsx) and are
shared by both scenes: `SkyDome` (GLSL dusk + crawling banded sun), `NeonRoad` (GLSL
perspective grid), `DecoTower`, `PalmTree`, `StreetLamp`, `ViceCar`, `NeonBar`,
`MarqueeLights`, `StripRig` (the shared light rig).

The same file owns the 3D material API, and scenes should go through it rather than
constructing their own: `VICE` (the palette, in three.js colour space) and `viceHex`;
`paint(color, {rough, metal})`, `chrome(rough)`, `stucco(color)`, `tubeMat(color, dim)`,
`haloMat(color, opacity)` — all memoised behind one module-level `Map`, so asking for the
same material twice is free. Plus `easeOutBack`, `clamp01` and `damp` for frame-rate-
independent animation.

Two scenes, both narrating the product rather than decorating it:

- **`hero`** — [hero-vice-scene.tsx](components/three/hero-vice-scene.tsx). A hotel sign
  advertises a price; every `BREAK_EVERY` (4200ms) one tube burns out and flickers blood
  red, and `HEAL_AFTER` (1450ms) later a verified repair strikes it back in mint before
  cooling to the row colour. That loop *is* the pitch.
- **`boulevard`** — [boulevard-scene.tsx](components/three/boulevard-scene.tsx). Scroll
  drives the camera down the strip past five billboards — Observe, Compile, Verify, Heal,
  Diff — each striking its tubes as you reach it and going dark on the way back up.

Both are mounted through [vice-stage.tsx](components/three/vice-stage.tsx), a
`dynamic(..., { ssr: false })` wrapper with a CSS-only sunset skeleton, so three.js never
enters the server bundle or first paint. The `<Canvas>` itself lives in
[vice-stage-inner.tsx](components/three/vice-stage-inner.tsx).

### Performance rules

- Geometries and materials are cached at module scope (`frondGeom`, `lampGeom`,
  `wheelGeom`, and the `paint`/`tubeMat` map). Never allocate in `useFrame`.
- Bloom is faked with `MeshBasicMaterial` (`toneMapped: false`) plus additive halo
  meshes — no postprocessing dependency, which is what keeps this affordable on a laptop
  GPU while still reading as neon.
- `frameloop` is gated: `'never'` off-screen, `'demand'` under `prefers-reduced-motion`,
  `'always'` only when visible and in motion.
- `dpr={[1, 1.75]}`, `shadows="soft"`, camera `far: 400`.

---

## 5. Accessibility

- **`prefers-reduced-motion`** collapses every animation and transition globally, hides
  the CRT scan line, shows all `.reveal` content unconditionally, and drops both canvases
  to `frameloop="demand"` — a reduced-motion visitor still gets the whole city, it simply
  stops moving.
- **`prefers-contrast: high`** takes borders and muted text to solid white, sets
  `--scanline-opacity: 0`, and strips the glow off `.neon-text`.
- Focus is a visible **2px aqua outline at 3px offset** on every focusable element.
- Touch targets are ≥44px, and `.touch-target` goes to 48px under 768px.
- The CRT overlay and vignette are `pointer-events: none` and `aria-hidden`, mounted once
  in [app/layout.tsx](app/layout.tsx).
- Neon text always sits on `night-900`/black — glow is additive on top of a contrast-safe
  pair, never the source of contrast itself.

A `.light` token block exists in `globals.css` (with `darkMode: ['class']` in the Tailwind
config), but **nothing in the UI toggles it** — there is no theme switcher. Treat it as a
starting point if one is ever wanted, not as a shipped feature.

---

## 6. Adding a surface

1. Pick the tone from its **meaning** (§1), not its looks.
2. Reach for `DecoPanel` before writing a container. Use `tilt={false}` in consoles.
3. Kicker → `.display` italic heading → `TubeRail` → body. That's the section rhythm.
4. Semantic colour goes through inline style with the hex, so the tube, the halo and the
   text shadow all derive from one value:
   ```tsx
   style={{ borderColor: c, boxShadow: `0 0 18px -8px ${c}`, textShadow: `0 0 10px ${c}88` }}
   ```
5. Any bar, ratio or score is a `.hud-meter`, never a bare `<progress>`.

## 7. Verification

`npm run verify` and `npm test` cover the engine (`src/`, `brightdata/`) only — they are
pure-Node with no install step and no `next build`, and a retheme must never make them
depend on one. The fixture page in `src/fixture-page.js` is a **CI assertion target**
(`money('.total-price')` and friends); its selectors and DOM shape are load-bearing and
are deliberately left un-themed.
