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

Every atmospheric visual — the code rain, floor grid, dust, scanlines, wordmark,
crawler and fallback portrait — is procedural: canvas, CSS gradients, or inline
SVG. The one character asset is an original, non-identifiable operator portrait;
it is documented in §7 and contains no third-party show or actor image.

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

Legacy scale names (`neon`/`mint`→`matrix`, `gold`/`stud`→`phosphor`,
`aqua`/`azure`→`data`, `blood`/`rose`→`alarm`, `sunset`/`amber`/`tangerine`→`warn`,
`violet`/`vice`/`night`/`plate`→`void`) are kept **only** so no surface can fall
back to an off-theme Tailwind pink or orange. Do not write new code against them.

`violet` still shadows Tailwind's built-in violet; here it resolves to the void, so
`violet-*` anywhere in this repo is black-to-phosphor-white and there is no
`violet-50/100/900`.

### Backgrounds and shadows

The page backdrop is not a utility class — it is `.construct-body::before`, applied
once to `<body>` in [app/layout.tsx](app/layout.tsx) and fixed at `z-index: -3`:
true black with a very faint green fog pooling at the bottom of the frame and a
weaker one in the upper left. Pages never paint their own background.

- `bg-matrix-rule` — a hairline running transparent → phosphor → transparent. The
  navigation and footer edges.
- `shadow-matrix` / `shadow-matrix-sm` — hairline ring + near halo + far bloom.
- `shadow-chrome` — hot top edge, black underside, long fall-off. For trim.
- `shadow-deco` — the panel shadow: inset highlight, deep drop, faint green spill.
- `bg-code-fade`, `bg-chrome` and `bg-sunset-sky` (now a black→deep-green gradient)
  are defined and available. Reach for them before hand-rolling a new gradient.

Halo strength is tuned in one place — `--halo-soft` / `--halo` / `--halo-hot` in
`:root`. Do not invent a new `box-shadow` blur radius per component.

---

## 2. Typography

Two families, loaded through a single Google Fonts `@import` at the top of
[app/globals.css](app/globals.css) (Inter + JetBrains Mono, `display=swap`).

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

`.phosphor-text` / `.phosphor-text-bright` (a tight core plus one short halo — at
most one line per screen), `.code-text`, `.outline-text`, `.sys-prompt` (draws a
`>` in the `::before`, so it can never be selected or copied), and `.caret` (a
blinking block caret for anything reading as a live terminal).

`.neon-text`, `.chrome-text` and `.sunset-text` survive as aliases so no legacy
call site loses its colour; they resolve to the phosphor treatments.

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
| `matrix-background.tsx` | Composes the five layers. Fixed, `aria-hidden`, pointer-transparent. |
| `matrix-rain.tsx` | The code rain. One canvas, one `requestAnimationFrame` loop, no React state. |
| `use-scan.ts` | The scan state machine. **The only** implementation of a scan in the repo. |
| `matrix-scan.tsx` | The visible half: sweeping line, digital noise, terminal readout. Renders nothing when idle. |
| `boot-intro.tsx` | The opening sequence (§5). |
| `guide-character.tsx` / `guide-portrait.tsx` | The resident guide (§6) and its portrait slot (§7). |
| `logo-spider.tsx` | The crawler beside the wordmark. Pure CSS, no JS, no re-render. |
| `system-ticker.tsx` | A slow marquee of what the system *is* — static capability labels, never a live reading. |
| `system-footer.tsx` | The bottom of the system, including what this build actually runs against. |

### Utility classes — [app/globals.css](app/globals.css)

`.panel` / `.panel-rail` / `.panel-marks` / `.panel-lift` · `.terminal` /
`.terminal-bar` / `.terminal-phosphor` · `.sys-btn` / `.sys-btn-solid` /
`.sys-btn-ghost` · `.sys-label` / `.sys-prompt` / `.caret` · `.sys-rule` /
`.chrome-rule` · `.scan-host` / `.scan-line` / `.scan-line-hover` /
`.scan-readout` / `.scan-noise` · `.hud-meter` (drive with `--meter: <hex>`) ·
`.status-dot` / `.status-dot-live` · `.wr-logo` / `.wr-tile*` / `.wr-word*` ·
`.wr-spider*` · `.construct-grid` / `.construct-dust` · `.crt-overlay` /
`.crt-vignette` (mounted once in the root layout, `aria-hidden`) ·
`.scene-3d` / `.card-3d` / `.tilt-3d` · `.reveal` / `.reveal-in` · `.skip-link`.

Accent colour reaches all of them through **`--accent`**, so one class serves every
state: `<div className="panel panel-rail" style={{ '--accent': FAIL }}>`.

The `.deco-panel` / `.glass-panel` / `.glass-card` / `.neon-btn` names still exist
and now resolve to the panel and key styles above. They are a compatibility shim,
not an API.

Motion utilities: `animate-scan`, `animate-scan-once`, `animate-grid-drift`,
`animate-caret-blink`, `animate-marquee`, `animate-float`, `animate-fade-in-up`,
`animate-neon-pulse` (a phosphor pulse), `animate-flicker` (a failing ballast, kept
for the wordmark), plus the globals-only `animate-glitch-in`, `animate-shimmer`,
`animate-pulse-glow`, `animate-border-glow`, `animate-tube-flicker`.

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
wordmark in [components/brand/webreceipt-logo.tsx](components/brand/webreceipt-logo.tsx),
and [components/navigation.tsx](components/navigation.tsx). There is no
design-system `ui/` directory, no three.js layer, no gamification, no XP or
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

Five layers, back to front. Nothing in it is interactive, and nothing in it is
announced to a screen reader.

| Layer | What | Where |
| --- | --- | --- |
| L1 | true black + low green fog | `.construct-body::before`, `z-index: -3` |
| L2 | falling code | `MatrixRain` canvas, inside `MatrixBackground` |
| L3 | perspective floor grid + digital dust | `.construct-grid` / `.construct-dust`, `z-index: -1` |
| L4 | drifting system glyphs | four absolutely-positioned spans in `MatrixBackground` |
| L5 | the interface | everything else |

Above the content, and equally non-interactive: `.crt-overlay` (scanlines plus one
9-second sweep) and `.crt-vignette`, mounted once in the root layout.

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

Never add a second animation loop. If something needs to move, it goes through an
existing keyframe or the scan system.

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
[boot-intro.tsx](components/matrix/boot-intro.tsx) runs black → figure → scan →
boot log → lift, 3.4 seconds, **once per session**, skippable with the button or
Escape, and never at all under reduced motion. The short runtime is the point — a
cinematic that plays on every navigation stops being cinematic and becomes a toll.

---

## 6. The guide

[guide-character.tsx](components/matrix/guide-character.tsx) is a resident operator
that says one short thing and gets out of the way. Sizing is the whole design: a
76px portrait and a panel capped at `20rem`, anchored bottom-left.

- one line of dialogue, two at most, per route
- it withdraws on its own after 11 seconds
- dismissing it is remembered for the session
- a 28px handle brings it back

Messages live in one `SCRIPT` record keyed by route, and each one points at the
next place worth going. If you add a route, add a line — a guide that has nothing
to say on a page should not appear on it.

---

## 7. The operator portrait

`public/guide/guide.png` is an original, non-identifiable operator portrait for
the opening sequence and floating guide. It takes the requested Matrix-like,
tattooed-strategist mood without copying a real actor or a television still.

The floating guide uses a 1:1.28 crop, 240×307 minimum, `object-fit: cover` with
`object-position: top`. The opening uses the whole 2:3 figure with
`object-fit: contain`. Both are graded to sit in the environment. See
[public/guide/README.md](public/guide/README.md).

If the file ever 404s, `GuidePortrait` renders its fallback: a head-and-shoulders
figure resolved out of vertical code. The 404 result is cached in
`sessionStorage`, so a missing portrait costs one request per session rather than
one per render.

---

## 8. Accessibility

- **`prefers-reduced-motion`** strips every sweep, drift and flicker: animations
  collapse to 0.01ms, `.reveal` content shows unconditionally, the CRT sweep, the
  dust, the scan line, the crawler and the caret are removed, the grid stops
  drifting, the rain paints 16 static passes and then never moves, the scan
  collapses to an immediate handoff, and the opening sequence does not play. The
  system still reads as a terminal; it just stops moving.
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
- The evidence drawer closes on Escape.
- The environment and the CRT overlays are `pointer-events: none` and `aria-hidden`.
- Phosphor text always sits on black — glow is additive on top of a contrast-safe
  pair, never the source of contrast itself.

`darkMode: ['class']` is set in the Tailwind config and `<html>` carries `.dark`,
but there is no light theme and nothing toggles it. The system is one theme: the
screen is black because the screen is off.

---

## 9. Adding a surface

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

## 10. Truthfulness in the UI

This is a style rule here because it is a style problem: decorative surfaces are
exactly where a fake number goes unnoticed.

- The ticker carries **static capability labels**, never a live run count, uptime
  or verification result.
- The Next.js app runs against the **simulated collector**, and the interface says
  so — in the ticker, in the footer, and in the console copy. Nothing in the UI
  describes a `/console` run as a live Bright Data cloud run.
- No screen invents a Collector ID.

See [CLAUDE.md](CLAUDE.md) for the full set; those rules outrank anything here.

## 11. Verification

`npm run verify` and `npm test` cover the engine (`src/`, `brightdata/`) only —
they are pure-Node with no install step and no `next build`, and a retheme must
never make them depend on one. The fixture page in `src/fixture-page.js` is a **CI
assertion target** (`money('.total-price')` and friends); its selectors and DOM
shape are load-bearing and are deliberately left un-themed.
