# WebReceipt custom Bright Data Scraper Studio scraper

This directory is the auditable **custom Scraper Studio Browser Worker** used by WebReceipt. It is not a Scrapers Library wrapper.

## Package

- `input-schema.json` — required public `url` input reference.
- `interaction.js` — public offer → screenshot → click checkout → screenshot → parse → collect.
- `parser.js` — canonical observation + provenance parser.
- `output-schema.json` — required nested output-schema reference.
- `preview-input.json` — example preview input.
- `SELF_HEAL_PROMPT.md` — semantic repair prompt.
- `CLI_RUNBOOK.md` — coding-agent/CLI run → break → heal → approve → verify flow.

## Why Browser Worker is central

The controlled `/fixture/hotel` exposes only the offer initially. Checkout is hidden until a real click. The worker uses navigation, waits, click, page/network-idle waits and two screenshot tags before parsing.

It also fails closed for credential-bearing URLs, literal local/private-network hosts, encoded login/private paths, and redirects that land on those blocked states.

## Silent-corruption fixture

Initial parser intentionally contains:

```js
const finalTotal = money('.total-price');
```

V1:

```text
.total-price = ₹10,147  // actual amount due
```

V2:

```text
.total-price = ₹8,499  // subtotal, selector still works
[data-testid="order-total"] = restructured/split true total ₹10,147
```

WebReceipt detects the inconsistent Deal Contract and requests a semantic self-heal. Crucially, the app treats Bright Data's `preview_result` as **untrusted**: it compiles the preview, runs all Deal Contract checks, rejects bad previews, and only approves/autosaves a repair after the preview is valid. It then reruns the collector and verifies again.

## Scraper Studio setup

1. Deploy WebReceipt publicly.
2. Create a custom **Browser Worker**.
3. Define required `url` input using `input-schema.json` as reference.
4. Paste `interaction.js` and `parser.js`.
5. Preview V1 with your deployed fixture URL.
6. Verify output fields against `output-schema.json`.
7. **Save to Production** and copy the `c_...` Collector ID.
8. Configure WebReceipt server-side secrets + operator token.

Run locally before recording:

```bash
npm run verify
```
