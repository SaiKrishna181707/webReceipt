# WebReceipt Style Guide — **The Construct**

The interface is a terminal inside a system that is watching itself. Everything on
screen is either **code falling in the dark**, a **panel bolted into that dark**, or
a **readout** printed on one. There is no flat grey card anywhere in the product,
and there is no colour that does not mean something.

Four rules carry the whole system:

1. **The screen is off until something needs to be read.** True black is the
   default surface. Light is spent, never sprayed — if a surface glows, it is
   asserting something.
2. **One hue, three intensities.** Bright phosphor for what is active, mid for
   structure, dim for everything falling in the background. Amber and red exist
   only so a failing check cannot be mistaken for a passing one.
3. **Every state change is a scan.** The border illuminates, a line sweeps, a
   terminal word appears, then it settles. Nothing pulses forever.
4. **System information is monospaced. Prose is not.**

And one constraint inherited from the previous system, still in force:

Every atmospheric visual — the code rain, floor grid, dust, scanlines, crawler,
cursor trail and the WebGL effects — is procedural: canvas, WebGL, CSS gradients or
inline SVG. Only two raster assets ship, the operator figure and the wordmark
artwork; both are original, neither contains a third-party show or actor image, and
both fall back to inline SVG. They are documented in §6.

---

## 1. Palette

Defined once in [tailwind.config.ts](tailwind.config.ts) and mirrored as CSS
variables in [app/globals.css](app/globals.css). Each scale runs 100 → 900, dark at
the high end, so `400` is the lit stop for every family.

| Token | Signature stop | What it's allowed to mean |
| --- | --- | --- |
| `matrix` | `400` · `#33ff66` | Bright phosphor. Primary brand, primary CTA, active, verified, healed, added. |
| `phosphor` | `400` · `#3fbf66` | Mid phosphor. Structure, kickers, labels, borders, step tracks. Reads as "system", not "alert". |
| `data` | `400` · `#2fe3ba` | Data teal. Evidence, hashes, provenance, information channels, diffs. |
| `warn` | `400` · `#ccbb45` | Amber CRT. **Warnings, in-flight, gated.** Desaturated on purpose — this is not neon orange. |
| `alarm` | `400` · `#ff4d4d` | The one alarm colour. **Integrity failures, rejected repairs, removed lines.** |
| `void` | `100` · `#e8ffee` / `900` · `#000000` | The screen. `100` is the pale green-white terminal type is printed in, `200` is body copy, `900` is true black. |

Three of those six are the same hue at different intensities. That is deliberate:
`warn` and `alarm` are the only non-green tones in the product, which is what makes
a red row impossible to miss.

The seventeen legacy aliases from the pre-phosphor palette (`neon`, `mint`, `gold`,
`aqua`, `blood`, `rose`, `sunset`, `amber`, `violet`, `vice`, `night`, `plate`,
`brick`, `stud`, `azure`, `lime`, `tangerine`) are **gone**. They were a migration
shim; the migration finished, and every one of the seventeen had zero call sites.
Nothing may reintroduce a scale name that isn't in the table above.

Each scale also carries a `DEFAULT`, so the bare token is legal — `text-matrix` is
`matrix-400`. Prefer the numbered stop anyway, because it says which stop it is at
the call site. The `DEFAULT` exists so a bare token renders *something*: without it,
`border-matrix` and `text-matrix` compiled to nothing at all, which is how the
opening sequence silently lost its border, its text and its scan line at once.

### Backgrounds and shadows

The page backdrop is not a utility class — it is `.construct-body::before`, applied
once to `<body>` in [app/layout.tsx](app/layout.tsx) and fixed at `z-index: -3`:
true black with a very faint green fog pooling at the bottom of the frame and a
weaker one in the upper left. Pages never paint their own background.

- `bg-matrix-rule` — a hairline running transparent → phosphor → transparent. The
  navigation and footer edges. The only `backgroundImage` token, because it was the
  only one with a call site.
- `shadow-matrix` / `shadow-matrix-sm` — hairline ring + near halo + far bloom.

The other shadow and gradient tokens (`chrome`, `deco`, `neon`, `neon-sm`, `aqua`,
`gold`, `alarm`, `code-fade`, `sunset-sky`) are removed. `.panel` carries its own
shadow and every panel uses it; nothing was reaching for the tokens.

Halo strength is tuned in one place — `--halo-soft` / `--halo` / `--halo-hot` in
`:root`. Do not invent a new `box-shadow` blur radius per component.

---

## 2. Typography

Two families, loaded through `next/font/google` in
[app/layout.tsx](app/layout.tsx) — self-hosted and preloaded at build time. They
used to arrive via an `@import` at the top of `globals.css`, which is the worst
case: an import inside a stylesheet is discovered only after that stylesheet
parses, so first paint waited on a round trip to `fonts.googleapis.com`.

Both are variable fonts, so there is no weight list — the whole 300–800 range comes
down in one file per family.

> **`next/font` generates hashed family names** (`"__Inter_f367f3"`), which is the
> one gotcha in this section. A literal `font-family: Inter` does not fail loudly;
> it falls through to `system-ui` and the page just looks slightly wrong. Every
> declaration must route through `var(--font-display)` / `var(--font-mono)`, which
> is what `layout.tsx` publishes and what `globals.css` and `tailwind.config.ts`
> read. Do not write a face name anywhere else.

| Role | Family | Usage |
| --- | --- | --- |
| `font-sans` / `font-display` / `.display` | **Inter** | Everything a human reads as prose: headings, body, descriptions. |
| `font-mono` / `.mono` | **JetBrains Mono** | Everything the system says: kickers, labels, hashes, IDs, amounts, status, code. |

The interface is typographically plain on purpose. There is no display face and no
italic — `.display` hard-sets `font-style: normal`, because in a terminal nothing
leans. The atmosphere comes from the code behind the type, not from the type.

Body copy is `text-void-200` at 14.5–15px. Headlines are `text-void-100`, upright,
`font-bold`, tracking `-0.021em`. The kicker is the signature:

```
font-mono text-[10px] uppercase tracking-[0.28em] text-phosphor-400
```

which is what the `Kicker` component and the `.sys-label` class both emit.

### Text treatments

`.phosphor-text` (a tight core plus one short halo — at most one line per screen),
`.code-text`, `.sys-prompt` (draws a `>` in the `::before`, so it can never be
selected or copied), and `.caret` (a blinking block caret for anything reading as a
live terminal).

The alias treatments `.neon-text`, `.chrome-text`, `.sunset-text`, `.outline-text`
and `.phosphor-text-bright` are removed along with the legacy palette — none of them
had a call site.

---

## 3. Components

### The interface kit — [components/matrix/matrix-ui.tsx](components/matrix/matrix-ui.tsx)

| Component | Notes |
| --- | --- |
| `SystemButton` / `SystemLink` | A key on a terminal. `tone` ∈ 6 tones, `size` ∈ sm/md/lg, `variant` ∈ outline/solid/ghost. On `:active` the key sinks. `SystemLink` takes `scan` to run the 620ms scan before navigating — opt-in, because it is right for a hero CTA and wrong for a back-link. |
| `SystemCard` | A whole panel that scans, then routes. This is the card interaction from the brief. |
| `MatrixPanel` | Black glass, a lit power rail along the top edge, corner registration marks. `tilt` banks it ±2.5° toward the pointer; leave it off in consoles and dense data. |
| `SystemRail` | A segmented data rail that brightens left→right. Rule, divider, or step track. |
| `SystemStatus` / `StatusDot` | A live readout: dot, label, value. The nav and every page header use it. |
| `Kicker` / `SectionHead` | The standard section rhythm: kicker + rail, headline, one line of plain English. |
| `Reveal` | IntersectionObserver fade-up, `delay` in ms for staggering grids. |
| `DataDisc` | A phosphor disc with code crawling through it. Decorative, used sparingly. |

The six tones are `matrix`, `phosphor`, `data`, `warn`, `alarm`, `void` — exported
as the `MatrixTone` type, with the raw values available as `matrixTones` when a
surface needs to derive its own accent. **Product components import `matrixTones`
rather than hard-coding a hex**, so the palette has exactly one source of truth.

Each tone is eight values (`edge`, `edgeHot`, `line`, `face`, `faceHot`, `solid`,
`ink`, `solidInk`) piped into the CSS as `--btn-*`, which is why `.sys-btn` is one
class rather than six.

### The environment — [components/matrix/](components/matrix)

| File | Role |
| --- | --- |
| `matrix-background.tsx` | Composes the six layers. Fixed, `aria-hidden`, pointer-transparent. |
| `matrix-rain.tsx` | The code rain. One canvas, one `requestAnimationFrame` loop, no React state. |
| `cursor-smoke.tsx` | A phosphor trail following the pointer. One canvas at `z-[20]`, pointer-transparent. |
| `use-scan.ts` | The scan state machine. **The only** implementation of a scan in the repo. |
| `use-reduced-motion.ts` | Live `prefers-reduced-motion` subscription. **Every JS or WebGL loop must ask this** — a stylesheet cannot reach a `requestAnimationFrame` callback. |
| `matrix-scan.tsx` | The visible half: sweeping line, digital noise, terminal readout. Renders nothing when idle. |
| `boot-intro.tsx` | The opening sequence (§5). |
| `logo-spider.tsx` | The crawler beside the wordmark. Pure CSS, no JS, no re-render. |
| `system-ticker.tsx` | A slow marquee of what the system *is* — static capability labels, never a live reading. |
| `system-footer.tsx` | The bottom of the system, including what this build actually runs against. |

The resident guide (`guide-character.tsx` / `guide-portrait.tsx`) and the fullscreen
crawler swarm (`spiders.tsx`) were both removed. `logo-spider.tsx` is the one crawler
that remains, and it is scoped to the wordmark.

### The effect layer — [components/effects/](components/effects)

WebGL, on [ogl](https://github.com/oframe/ogl) rather than three.js — 423 KB
unpacked against 23 MB, for shaders this small. `ogl` ships untranspiled ESM, which
is why `next.config.js` lists it in `transpilePackages`; without that the build
fails on its `import` syntax.

| File | Role |
| --- | --- |
| `gated-effect.tsx` | IntersectionObserver wrapper. Mounts its child while onscreen and **unmounts** it when it leaves, so the GL context is released rather than idling. |
| `magic-rings.tsx` | Concentric phosphor rings. Behind the hero wordmark, gated. |
| `strands.tsx` | Drifting filaments. Behind one mid-page section, gated. |
| `pixel-card.tsx` | A canvas pixel-dissolve on hover. No GL — 2D canvas. |
| `click-spark.tsx` | Sparks at the click point. One fixed, pointer-transparent canvas at `z-[60]`, wrapping `{children}` in the root layout. |
| `light-tunnel.tsx` | **Vendored but not mounted.** See below. |
| `palette.ts` | The effects' colours, derived from `matrixTones`. No effect hard-codes a hex. |

Four rules govern this layer:

1. **Budget: one always-on shader.** Everything else is `GatedEffect`-wrapped.
   Browsers cap live WebGL contexts (~16 in Chrome) and silently drop the oldest, so
   an ungated effect per section is a bug that only shows up after scrolling.
2. **Every loop honours `useReducedMotion`** — render one static frame and stop.
   `globals.css` collapses CSS animation under that query, but it cannot see a RAF
   loop, so each effect has to comply itself.
3. **Colour comes from `palette.ts`**, which reads `matrixTones`. No violet, no
   magenta — the upstream React Bits defaults are recoloured to phosphor on the way
   in.
4. **`.panel` ends at `rgba(6,9,6,0.9)`** — 90% opaque. An effect placed *behind* a
   panel is invisible. It goes *inside* the `MatrixPanel`, with the content lifted to
   `relative z-[1]` above it.

`light-tunnel.tsx` is kept but unmounted. It was written to replace the rain as the
page background, and it is the better shader; the rain is the atmosphere the whole
product was tuned against, and it won. The file stays because the port is done and
the decision is reversible — swap it into `matrix-background.tsx` and delete the rain
if that call ever changes. It costs nothing while unreferenced: Next tree-shakes it
out of the bundle.

### Utility classes — [app/globals.css](app/globals.css)

`.panel` / `.panel-rail` / `.panel-marks` / `.panel-lift` · `.terminal` /
`.terminal-bar` / `.terminal-phosphor` · `.sys-btn` / `.sys-btn-solid` /
`.sys-btn-ghost` · `.sys-label` / `.sys-prompt` / `.caret` · `.sys-rule` ·
`.scan-host` / `.scan-line` / `.scan-line-hover` /
`.scan-readout` / `.scan-noise` · `.hud-meter` (drive with `--meter: <hex>`) ·
`.status-dot` / `.status-dot-live` · `.wr-spider*` · `.construct-grid` /
`.construct-dust` · `.crt-overlay` /
`.crt-vignette` (mounted once in the root layout, `aria-hidden`) ·
`.crt-scanlines` (the same treatment scoped to one element, for the opening
sequence) · `.scene-3d` / `.card-3d` · `.reveal` / `.reveal-in` · `.skip-link`.

Accent colour reaches all of them through **`--accent`**, so one class serves every
state: `<div className="panel panel-rail" style={{ '--accent': FAIL }}>`.

The compatibility shims are gone: `.deco-panel`, `.glass-panel`, `.glass-card`,
`.glass-card-hover`, `.deco-corner`, `.deco-lift`, `.neon-btn`, `.neon-btn-solid`,
`.glow-*`, `.neon-rule`, `.chrome-rule`, `.tilt-3d`, `.tooltip`, `.skeleton`,
`.success-check`, `.error-shake`, `.btn-hover`, `.input-focus`, `.progress-bar`,
`.hero-title` and `.section-title` are removed. Each had zero call sites and each
was kept alive by a comment promising a migration that had already finished.

Motion utilities, and this is the whole list: `animate-scan`, `animate-marquee`,
`animate-float`, `animate-fade-in-up` from the Tailwind config, plus the
globals-only `.animate-shimmer` (used by `app/loading.tsx`). `animate-scan-once`,
`animate-grid-drift`, `animate-caret-blink`, `animate-neon-pulse`,
`animate-flicker`, `animate-glitch-in`, `animate-pulse-glow`, `animate-border-glow`
and `animate-tube-flicker` are removed — all nine were unreferenced. The keyframes
they wrapped (`gridDrift`, `caretBlink`, `flicker`, `spider*`) survive in
`globals.css`, where the classes that actually use them declare `animation:`
directly.

### Geometry

Radii are **2px**, everywhere. The only round things are status dots and the disc.

### Product components — [components/product/](components/product)

Eight, and only eight. Each is a themed view over a slice of the engine's output;
none of them own state beyond local UI.

| File | Reads | Lit as |
| --- | --- | --- |
| `deal-contract-card.tsx` | the compiled contract | phosphor price board, matrix rail |
| `integrity-panel.tsx` | integrity checks + score | matrix / warn / alarm, with a `hud-meter` |
| `anomalies-panel.tsx` | anomaly list | warn noticeboard, per-severity accents |
| `promise-diff.tsx` | two observations | data header, matrix adds / alarm removes |
| `heal-console.tsx` | the repair timeline | matrix when healed, warn while gated, alarm when rejected |
| `journey-replay.tsx` | collector steps | a run of nodes, phosphor → warn → alarm |
| `event-log.tsx` | the event stream | a terminal with phosphor scanlines |
| `evidence-drawer.tsx` | raw captured evidence | matrix-sealed drawer, data-toned capture text |

That is the whole component library, plus the interface kit, the environment, the
effect layer, the wordmark in
[components/brand/webreceipt-logo.tsx](components/brand/webreceipt-logo.tsx),
and [components/navigation.tsx](components/navigation.tsx). There is no
design-system `ui/` directory, **no three.js** (the shaders are ogl — see the effect
layer above), no gamification, no XP or
achievements, no voice navigation, no natural-language search, no WebSocket
presence, and no sidebar — earlier revisions of this document described some of
those, and none of them exist here now.

### Pages

Five: [app/page.tsx](app/page.tsx) (the pitch),
[app/console/page.tsx](app/console/page.tsx) (run a URL through the pipeline),
[app/mutation-lab/page.tsx](app/mutation-lab/page.tsx) (the chaos switchboard),
[app/receipts/page.tsx](app/receipts/page.tsx) (the secure records),
[app/docs/page.tsx](app/docs/page.tsx). Plus `app/loading.tsx`, a themed skeleton.

`/docs` is deliberately the quietest page in the product. Reference material has to
be readable first; the theme is a frame around it, not a filter over it.

---

## 4. The environment

Six layers, back to front. Nothing in it is interactive, and nothing in it is
announced to a screen reader.

| Layer | What | Where |
| --- | --- | --- |
| L1 | true black + low green fog | `.construct-body::before`, `z-index: -3` |
| L2 | falling code | `MatrixRain` canvas, inside `MatrixBackground` |
| L3 | perspective floor grid + digital dust | `.construct-grid` / `.construct-dust`, `z-index: -1` |
| L4 | drifting system glyphs | absolutely-positioned spans in `MatrixBackground` |
| L5 | scan sweep + scanlines + vignette | `.crt-overlay` / `.crt-vignette`, above content, non-interactive |
| L6 | the interface | everything else |

`.crt-overlay` (scanlines plus one 9-second sweep) and `.crt-vignette` are mounted
once in the root layout.

**The WebGL effects are deliberately not part of this.** They are section-scoped and
mount through `GatedEffect`; the environment stays the rain, which is the one
atmosphere the whole product was tuned against. See §3.

### Performance rules

Performance is a constraint on this layer, not an afterthought — a background that
costs frames is worse than no background.

- **The rain is one canvas, not a particle system.** A DOM system at this density
  would be thousands of nodes and a permanent layout cost. Here the whole
  environment is a single composited layer.
- **The rain never re-renders React.** No state, no props changing per frame; the
  loop lives entirely inside one `useEffect`.
- The loop is throttled to **~20fps**. The rain is stepped in the films too;
  smoothness buys nothing and costs half the frames.
- Device pixel ratio is capped at **1.5**.
- The trail is a translucent black fill, so old glyphs decay for free rather than
  being tracked and erased.
- The loop **stops entirely** when the tab is hidden (`visibilitychange`) and never
  starts under reduced motion.
- L3 and L4 are gradients and transforms — no JS at all. The crawler is a long CSS
  keyframe track with repeated waypoints, which is where its pauses and changes of
  direction come from.
- Under 768px the environment thins out: the grid drops to `30vh` at lower opacity,
  the dust is removed, and `--rain-opacity` falls to `0.3`.

Never add a second always-on animation loop. If something needs to move, it goes
through an existing keyframe, the scan system, or a `GatedEffect`-wrapped effect that
unmounts when it scrolls offscreen.

---

## 5. The scan system

One implementation: [use-scan.ts](components/matrix/use-scan.ts) drives state,
[matrix-scan.tsx](components/matrix/matrix-scan.tsx) draws it, and
`.scan-host` / `.scan-line` / `[data-scan="run"]` in globals.css do the work.

620ms end to end, in three phases: `scanning` (0–230ms) → `verifying` (230–440ms)
→ `granted` (440–620ms) → the action fires. The border illuminates for the whole
window, a line sweeps once, and the readout prints `SCANNING…` → `VERIFYING…` →
`ACCESS GRANTED` in an `aria-live="polite"` region.

Re-entrant calls are ignored while a scan is running, so a double-click cannot fire
the action twice. Modified clicks (⌘/Ctrl/Shift, middle button) bypass the scan
entirely and let the browser open a new tab. Under reduced motion the whole thing
collapses to an immediate handoff.

**Do not write a local sweep.** Cards, buttons, panels and navigation all drive
this hook; a second implementation is how the timings drift apart.

The opening sequence is a separate thing, not a scan at a larger scale:
[boot-intro.tsx](components/matrix/boot-intro.tsx) is a full-bleed black overlay —
code rain at 20% behind a radial vignette, the operator figure filling the left 58%,
and one line of instruction in the corner. There is no boot log and no typed quote;
earlier revisions had both and both were cut.

It has **no timer**. It holds until the visitor dismisses it — click anywhere, or
Enter / Space / Escape — then runs a 460ms lift and **unmounts itself**. Three things
about that are load-bearing:

- **It unmounts.** A `role="dialog" aria-modal="true"` element at `z-9999` that only
  fades is still a modal as far as assistive tech is concerned, for the rest of the
  session. The exit ends in a `phase` of `done` and a `return null`.
- **It traps focus while open.** The overlay holds no focusable children, so the trap
  is `preventDefault()` on Tab. Without it, Tab walks into the scroll-locked page
  behind the overlay — reachable by keyboard, invisible to the eye. On exit, focus
  goes to `#main`, which is why the root layout gives it `tabIndex={-1}`.
- **Once per session**, gated on `sessionStorage['wr:intro-seen']`. The key is *read*
  at mount and *written* on completion, never both in one effect — Strict Mode
  double-invokes effects, and a read-then-write would race itself into skipping.

The scroll lock is derived from `phase` rather than set once at mount, so it cannot
outlive the overlay if the component unmounts mid-transition.

Under reduced motion the sequence **still plays** — it is content, not decoration —
but the scan line is dropped and the exit is instantaneous instead of 460ms.

---

## 6. Image assets

The Next app uses three files from `public/`, and every one of them is referenced:

| File | Used by | Fallback |
| --- | --- | --- |
| `scofield.png` | the opening sequence, whole figure, `object-fit: contain`, `object-position: left bottom` | `webreceipt-mark.svg` |
| `ChatGPT_Image_Aug_21,_2026,_10_14_22_AM.png` | the hero wordmark in `webreceipt-logo.tsx` | `webreceipt-mark.svg` |
| `webreceipt-mark.svg` | the fallback for both of the above | — |

Both raster images are graded to sit in the environment rather than on top of it
(`brightness(.92) contrast(1.06)` for the figure), and both `<img>` tags carry an
`onError` handler, so a missing file degrades to the mark instead of an alt-text box.

The wordmark is that raster crop, positioned by offsets inside an
`overflow-hidden` box. `globals.css` used to also carry a full CSS lockup
(`.wr-logo` / `.wr-tile*` / `.wr-word*` / `.wr-flicker` — two element tiles with
atomic numbers, sized in `em`), built as a replacement for the crop. The crop was
kept, so the lockup had no call site and has been removed; it is in git history if
that call is ever revisited. **One loose end:** `webreceipt-logo.tsx` applies
`wr-logo-spotlight`, which nothing defines. It is inert — the visible treatment comes
from the Tailwind classes beside it — but it is a dangling name, not a hook.

The resident guide component (`guide-character.tsx` / `guide-portrait.tsx`) was
removed, so `public/guide/` is no longer rendered by anything. The files are kept as
the provenance record for that original artwork.

> **`public/` is not the Next app's territory alone.** `index.html`, `app.js` and
> `styles.css` are the **sponsor harness operator UI** — `src/server.js` serves them
> at `/` via `staticFile()`, the `Dockerfile` copies the whole directory, and
> `test/http.test.js` asserts `HEAD /` returns 200 `text/html`. They look
> unreferenced to a grep of `app/` and `components/` because the path is joined at
> runtime. **Do not delete anything in `public/` on the strength of a reference
> search over the Next tree.** Run `npm run verify` first; it will catch you.

---

## 7. Accessibility

- **`prefers-reduced-motion`** strips every sweep, drift and flicker: animations
  collapse to 0.01ms, `.reveal` content shows unconditionally, the CRT sweep, the
  dust, the scan line, the crawler and the caret are removed, the grid stops
  drifting, the rain paints 16 static passes and then never moves, the scan
  collapses to an immediate handoff, and every WebGL effect renders one frame and
  stops. The system still reads as a terminal; it just stops moving.
  **The opening sequence still plays** — it is content, not decoration — but its exit
  is instant and its scan line is dropped (§5).
  A stylesheet cannot reach a `requestAnimationFrame` callback, so anything animating
  in JS or WebGL subscribes to
  [use-reduced-motion.ts](components/matrix/use-reduced-motion.ts) and honours the
  answer itself. Treat `true` as "stop", not "never start" — the hook returns `false`
  during server render so the markup matches.
- **`prefers-contrast: high`** takes borders and muted text to solid `#33ff66` /
  `#e8ffee`, sets `--scanline-opacity: 0`, removes the grid, dust and vignette, and
  strips the glow off every phosphor treatment.
- Focus is a visible **2px phosphor outline at 2px offset**, with a short halo, on
  every focusable element via `*:focus-visible`.
- A `.skip-link` is the first thing in the tab order.
- Touch targets are ≥44px, and `.touch-target` goes to 48px under 768px.
- The collapsed mobile nav sheet is `aria-hidden` with `tabIndex={-1}` on its
  links — it collapses by `max-height`, so without that its links stay focusable
  while invisible. The hamburger carries `aria-expanded` + `aria-controls`.
- The opening sequence traps focus while open and returns it to `#main` on exit, and
  it leaves the tree entirely rather than lingering as a dead `aria-modal` node (§5).
- The evidence drawer closes on Escape.
- The environment and the CRT overlays are `pointer-events: none` and `aria-hidden`.
- Phosphor text always sits on black — glow is additive on top of a contrast-safe
  pair, never the source of contrast itself.

`darkMode: ['class']` is set in the Tailwind config and `<html>` carries `.dark`,
but there is no light theme and nothing toggles it. The system is one theme: the
screen is black because the screen is off.

---

## 8. Adding a surface

1. Pick the tone from its **meaning** (§1), not its looks. If it is not reporting
   a state, it is `matrix` or `phosphor`.
2. Reach for `MatrixPanel` (or `panel panel-rail`) before writing a container.
   Leave `tilt` off in consoles and dense data.
3. Kicker → headline → `SystemRail` → body. That's the section rhythm, and
   `SectionHead` emits it for you.
4. Semantic colour goes in through `--accent` with a value from `matrixTones`, so
   the rail, the corner marks, the hover border and the halo all derive from one
   value:
   ```tsx
   style={{ ['--accent' as string]: matrixTones.alarm.line }}
   ```
5. Any bar, ratio or score is a `.hud-meter`, never a bare `<progress>`.
6. If it needs to acknowledge a click, use the scan system. Never a local sweep.
7. If it wants a shader behind it, wrap it in `GatedEffect` and put the effect
   *inside* the panel with the content at `relative z-[1]`. `.panel` is 90% opaque,
   so an effect behind one is simply invisible (§3).

## 9. Truthfulness in the UI

This is a style rule here because it is a style problem: decorative surfaces are
exactly where a fake number goes unnoticed.

- The ticker carries **static capability labels**, never a live run count, uptime
  or verification result.
- The interface states which collector it is running against — in the ticker, in the
  footer, and in the console copy. Nothing in the UI describes a `/console` run as a
  live Bright Data cloud run. **That copy is a factual claim about the deployment, so
  it is not a styling decision and must not be edited for tone.** If the backing
  reality changes, [CLAUDE.md](CLAUDE.md) is what says so, and the copy follows it —
  never the other way round.
- No screen invents a Collector ID.

See [CLAUDE.md](CLAUDE.md) for the full set; those rules outrank anything here.

## 10. Verification

`npm run verify` and `npm test` cover the engine (`src/`, `brightdata/`) only —
they are pure-Node with no install step and no `next build`, and a retheme must
never make them depend on one. The fixture page in `src/fixture-page.js` is a **CI
assertion target** (`money('.total-price')` and friends); its selectors and DOM
shape are load-bearing and are deliberately left un-themed.
