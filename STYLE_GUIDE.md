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

Every atmospheric visual — the tunnel, the drifting glyphs, the scanlines, the
wordmark and the crawler — is procedural: WebGL shaders, CSS gradients, or inline
SVG. The one raster asset in the interface is the opening sequence's portrait.

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

Every scale also carries a **`DEFAULT`** — the `400` stop, except `void`, where it is
true black. Without it Tailwind emits nothing at all for the bare utility, so
`border-matrix` and `text-matrix` render as if unstyled. Nothing in the app relies on
the bare form today (the opening sequence was the one place that did, and it now names
`matrix-400` / `matrix-300` explicitly, which is clearer at the call site) — the
`DEFAULT` is there so reaching for it is never a silent no-op.

The palette is these six names and nothing else. Earlier revisions carried a set of
Vice City aliases (`neon`, `mint`, `gold`, `aqua`, `sunset`, `violet`, and a dozen
more) so no surface could fall back to an off-theme Tailwind pink; every one of them
had reached zero call sites and they have been removed. If you find one in a diff, it
is a mistake, not a legacy path.

### Backgrounds and shadows

The page backdrop is not a utility class — it is `.construct-body::before`, applied
once to `<body>` in [app/layout.tsx](app/layout.tsx) and fixed at `z-index: -3`:
true black with a very faint green fog pooling at the bottom of the frame and a
weaker one in the upper left. Pages never paint their own background.

- `bg-matrix-rule` — a hairline running transparent → phosphor → transparent. The
  navigation and footer edges.
- `shadow-matrix` / `shadow-matrix-sm` — hairline ring + near halo + far bloom.

Halo strength is tuned in one place — `--halo-soft` / `--halo` / `--halo-hot` in
`:root`. Do not invent a new `box-shadow` blur radius per component.

---

## 2. Typography

Two families, loaded through `next/font/google` in
[app/layout.tsx](app/layout.tsx) (Inter + JetBrains Mono, both variable faces,
`display: 'swap'`). They are self-hosted and preloaded at build time; they used to
arrive through an `@import` at the top of `globals.css`, which is the one place a
font request can block first paint twice over — the stylesheet has to parse before
the import is even discovered.

The catch is that `next/font` generates a **hashed family name**, so nothing may
name `Inter` or `JetBrains Mono` and expect a hit. Every rule goes through
`var(--font-display)` / `var(--font-mono)`, and both the Tailwind `fontFamily` map
and the raw `font-family` declarations in `globals.css` are written that way. A
literal family name there fails silently to `system-ui`.

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
| `matrix-background.tsx` | Composes the four layers. Fixed, `aria-hidden`, pointer-transparent. |
| `use-reduced-motion.ts` | A live `prefers-reduced-motion` subscription. Every WebGL loop reads it — the CSS query cannot reach a `requestAnimationFrame` loop. |
| `use-scan.ts` | The scan state machine. **The only** implementation of a scan in the repo. |
| `matrix-scan.tsx` | The visible half: sweeping line, digital noise, terminal readout. Renders nothing when idle. |
| `boot-intro.tsx` | The opening sequence (§5). |
| `spiders.tsx` | Three crawlers on the page, `z-[2]`. One `requestAnimationFrame` loop for all of them. |
| `logo-spider.tsx` | The crawler beside the wordmark. Pure CSS, no JS, no re-render. |
| `system-ticker.tsx` | A slow marquee of what the system *is* — static capability labels, never a live reading. |
| `system-footer.tsx` | The bottom of the system, including what this build actually runs against. |

### The effect layer — [components/effects/](components/effects)

Five WebGL/canvas effects vendored from React Bits (`ts-tailwind` variants) and
adapted. Four adaptations apply to all of them: `'use client'`, a
`prefers-reduced-motion` bail-out, phosphor recolour, and a cleanup that actually
releases the GL context — Strict Mode double-invokes effects in dev, so a leak
there caps the browser out within a few navigations.

| File | Role | Dep |
| --- | --- | --- |
| `light-tunnel.tsx` | The background. Cables receding to a vanishing point, with pulses running outward. The one always-on shader. | ogl |
| `strands.tsx` | Ribbons behind the Evidence panel. The page's single signature effect. | ogl |
| `magic-rings.tsx` | Rings expanding from behind the hero wordmark. **Ported from three.js to ogl** — the fragment shader is upstream's, unchanged; only the renderer differs. | ogl |
| `pixel-card.tsx` | A pixel field that grows in on hover. Defaults to the `matrix` variant; the `alarm` variant is for panels already toned red. | — |
| `click-spark.tsx` | Sparks at the click point, on a fixed viewport-sized canvas. | — |
| `gated-effect.tsx` | IntersectionObserver wrapper. Mounts its child onscreen, **unmounts** it off — pausing a loop is not enough, the context has to be released. | — |
| `palette.ts` | The only place an effect's colour is decided. Derives from `matrixTones`, so a shader cannot drift off-theme. | — |

**Budget: one always-on shader.** The tunnel is always live; MagicRings and Strands
render through `GatedEffect` and are gone the moment their section scrolls away. If
a third always-on shader ever looks necessary, one of these has to go.

Effects that sit on a `MatrixPanel` go **inside** it, above the panel face and below
the content (`relative z-[1]`), never behind it. The `.panel` background ends at
`rgba(6,9,6,0.9)` — 90% opaque — so a canvas underneath is invisible.

### Utility classes — [app/globals.css](app/globals.css)

`.panel` / `.panel-rail` / `.panel-marks` / `.panel-lift` · `.terminal` /
`.terminal-bar` / `.terminal-phosphor` · `.sys-btn` / `.sys-btn-solid` /
`.sys-btn-ghost` · `.sys-label` / `.sys-prompt` / `.caret` · `.sys-rule` ·
`.scan-host` / `.scan-line` / `.scan-line-hover` / `.scan-readout` /
`.scan-noise` · `.hud-meter` (drive with `--meter: <hex>`) · `.status-dot` /
`.status-dot-live` · `.wr-logo` / `.wr-tile*` / `.wr-word*` / `.wr-flicker` ·
`.wr-spider*` · `.sun-disc` · `.crt-overlay` / `.crt-vignette` (mounted once in
the root layout, `aria-hidden`) · `.crt-scanlines` (the scanline texture on its
own, no positioning or sweep — for anything that sits *above* `.crt-overlay` and
has to paint its own CRT surface, which is the opening sequence) · `.scene-3d` /
`.card-3d` · `.reveal` / `.reveal-in` · `.skip-link`.

`.wr-spider*` belongs to `logo-spider.tsx` alone. The fullscreen crawlers in
`spiders.tsx` use `.wr-crawler-*` in a scoped `<style jsx>` block — a different
gait (a rotation about `16px 17px`, not a translate/scale bob about `12px 12px`),
and the two were the same class name for a while, which is a trap even when
styled-jsx scoping happens to keep them apart.

Accent colour reaches all of them through **`--accent`**, so one class serves every
state: `<div className="panel panel-rail" style={{ '--accent': FAIL }}>`.

Motion utilities, and this is the complete list: `animate-scan`, `animate-marquee`,
`animate-float`, `animate-fade-in-up` (from the Tailwind config) plus
`animate-shimmer` (globals-only, used by the loading skeleton). A previous revision
of this document advertised a dozen more — `animate-scan-once`, `animate-grid-drift`,
`animate-neon-pulse`, `animate-glitch-in`, `animate-pulse-glow`, `animate-tube-flicker`
and friends. None of them had a call site and none of them exist now.

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
design-system `ui/` directory, no gamification, no XP or achievements, no voice
navigation, no natural-language search, no WebSocket presence, and no sidebar —
earlier revisions of this document described some of those, and none of them exist
here now.

The WebGL layer runs on **`ogl`** (423 KB unpacked) and there is no `three` in the
dependency tree. That is a deliberate ceiling, not an accident of history: three.js
is 23 MB unpacked for what amounts to a full-screen triangle and a fragment shader.
The MagicRings port exists precisely so it did not have to be added.

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

Four layers, back to front. Nothing in it is interactive, and nothing in it is
announced to a screen reader.

| Layer | What | Where |
| --- | --- | --- |
| L1 | true black + low green fog | `.construct-body::before`, `z-index: -3` |
| L2 | the tunnel | `LightTunnel` canvas, inside `MatrixBackground` |
| L3 | drifting system glyphs | four absolutely-positioned spans in `MatrixBackground` |
| L4 | the interface | everything else |

It used to be five: L2 was the falling code and L3 a perspective floor grid plus
digital dust. The tunnel replaced all three. It already carries depth and
perspective, and a grid stacked on top of it read as two competing horizons.
`matrix-rain.tsx`, `.construct-grid` and `.construct-dust` are gone — if you find
one in a diff it is a mistake, not a legacy path.

The three crawlers from `spiders.tsx` sit at `z-[2]`, between the tunnel and the
interface. There were six at `z-[5]`; over a moving shader a cloud of them read as
dirt on the lens rather than life in the system.

Above the content, and equally non-interactive: `.crt-overlay` (scanlines plus one
9-second sweep) and `.crt-vignette`, mounted once in the root layout.

### Performance rules

Performance is a constraint on this layer, not an afterthought — a background that
costs frames is worse than no background.

- **One always-on GL context.** The tunnel. Everything else is gated (§3), which
  means *unmounted* offscreen, not paused: browsers cap live WebGL contexts around
  16 and silently drop the oldest, so a paused-but-mounted effect still spends one
  of them.
- **Nothing in the environment re-renders React.** No state, no props changing per
  frame; every loop lives inside one `useEffect` and writes to a canvas or to
  `style.transform` directly.
- Each loop **stops entirely** when the tab is hidden (`visibilitychange`) and
  under `prefers-reduced-motion`. That query collapses CSS animations globally but
  is invisible to a `requestAnimationFrame` loop, so every effect subscribes to it
  in JS through `use-reduced-motion.ts`.
- Device pixel ratio is capped — 1.5 for the shaders, 2 for the spark canvas. The
  spark canvas is `fixed` and viewport-sized rather than document-sized; a backing
  store as tall as a long page would cost on the order of 100 MB.
- The crawlers and L3 are transforms and gradients. The logo crawler is a long CSS
  keyframe track with repeated waypoints, which is where its pauses and changes of
  direction come from — no JS at all.
- MagicRings is desktop-only (`hidden lg:block`): at tablet width the hero's left
  column is the full page and the rings would sit under body copy.

Never add a second always-on loop. If something needs to move, it goes through an
existing keyframe, the scan system, or `GatedEffect`.

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

The opening sequence is the same idea at a larger scale:
[boot-intro.tsx](components/matrix/boot-intro.tsx) holds the portrait and types the
three lines over ~2.8s (900ms of black, then 26ms a character), then **waits** — it
does not lift on a timer. A click anywhere, Escape, Enter, Space or the Skip button
starts the 460ms lift, after which it unmounts.

Deliberately no auto-exit: the last line is the one thing on screen worth reading,
and a cover that removes itself mid-sentence is worse than one that asks for a
click. What keeps it from becoming a toll is the **once per session** gate
(`sessionStorage`, so a reload or a route change does not replay it) rather than a
short runtime.

Under reduced motion it still appears — an unannounced cover that never arrives is
its own surprise. It arrives fully typed instead, with every transition at 0ms, and
still waits to be dismissed.

---

## 6. Accessibility

- **`prefers-reduced-motion`** strips every sweep, drift and flicker: animations
  collapse to 0.01ms, `.reveal` content shows unconditionally, the CRT sweep, the
  scan line, the logo crawler and the caret are removed, the scan collapses to an
  immediate handoff, and the opening sequence arrives fully typed with 0ms
  transitions rather than animating in. It still appears, and still waits to be
  dismissed — see §5.
- The **WebGL and canvas layers honour the same query in JS**, through
  `use-reduced-motion.ts` — a CSS media query cannot reach a
  `requestAnimationFrame` loop, so without this the shaders would keep moving on a
  machine that asked them not to. Each one paints a single static frame and stops;
  the spark canvas does not spark; the fullscreen crawlers do not render at all
  (their positions come from the loop, so rendering them without it would stack
  three of them in the top-left corner). The subscription is live, so flipping the
  OS setting takes effect without a reload.
- **`prefers-contrast: high`** takes borders and muted text to solid `#33ff66` /
  `#e8ffee`, sets `--scanline-opacity: 0`, removes the vignette, flattens the
  wordmark tiles to black-on-green with no glow, and turns `.phosphor-text` into
  plain white with no text shadow.
- Focus is a visible **2px phosphor outline at 2px offset**, with a short halo, on
  every focusable element via `*:focus-visible`.
- A `.skip-link` is the first thing in the tab order.
- Touch targets are ≥44px, and `.touch-target` goes to 48px under 768px.
- The collapsed mobile nav sheet is `aria-hidden` with `tabIndex={-1}` on its
  links — it collapses by `max-height`, so without that its links stay focusable
  while invisible. The hamburger carries `aria-expanded` + `aria-controls`.
- The evidence drawer closes on Escape.
- The opening sequence **traps focus while open and unmounts on exit**, restoring
  focus to `#main` — which carries `tabIndex={-1}` for exactly that reason, and for
  the skip link. It used to leave a `role="dialog" aria-modal="true"` node at
  `z-9999` in the tree forever, with Tab walking into unreachable content behind it.
  `document.querySelectorAll('[aria-modal]').length === 0` after the intro lifts is
  the regression test.
- The environment and the CRT overlays are `pointer-events: none` and `aria-hidden`.
- So is every effect canvas, including the spark canvas — it is `fixed` across the
  whole viewport *above* the content, so without `pointer-events: none` it would
  swallow every click on the page.
- Phosphor text always sits on black — glow is additive on top of a contrast-safe
  pair, never the source of contrast itself.

`darkMode: ['class']` is set in the Tailwind config and `<html>` carries `.dark`,
but there is no light theme and nothing toggles it. The system is one theme: the
screen is black because the screen is off.

---

## 7. Adding a surface

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

## 8. Truthfulness in the UI

This is a style rule here because it is a style problem: decorative surfaces are
exactly where a fake number goes unnoticed.

- The ticker carries **static capability labels**, never a live run count, uptime
  or verification result.
- The Next.js app runs against the **simulated collector**, and the interface says
  so — in the ticker, in the footer, and in the console copy. Nothing in the UI
  describes a `/console` run as a live Bright Data cloud run.
- No screen invents a Collector ID.

See [CLAUDE.md](CLAUDE.md) for the full set; those rules outrank anything here.

## 9. Verification

`npm run verify` and `npm test` cover the engine (`src/`, `brightdata/`) only —
they are pure-Node with no install step and no `next build`, and a retheme must
never make them depend on one. The fixture page in `src/fixture-page.js` is a **CI
assertion target** (`money('.total-price')` and friends); its selectors and DOM
shape are load-bearing and are deliberately left un-themed.
