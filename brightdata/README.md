# WebReceipt custom Bright Data Scraper Studio scraper

This directory is the auditable **custom Scraper Studio Browser Worker** used by WebReceipt. It is not a Scrapers Library wrapper.

## Package

- `input-schema.json` — required public `url` input reference.
- `interaction.js` — public offer → screenshot → click checkout → screenshot → parse → collect.
- `parser.js` — canonical observation + provenance parser.
- `output-schema.json` — required nested output-schema reference.
- `preview-input.json` — example preview input.
- `SELF_HEAL_PROMPT.md` — semantic repair prompt.
- `CLI_RUNBOOK.md` — real coding-agent/CLI run → break → heal → approve → verify flow.

## Which server is used for real Bright Data proof?

The current repository has two distinct entry points:

- Next.js (`npm run dev` / `npm start`) — product UI backed by the deterministic simulator.
- Sponsor harness (`npm run start:brightdata` or Dockerfile) — `src/server.js`, which contains the real Bright Data adapter and the public controlled fixture endpoints.

Deploy the sponsor harness for the real Scraper Studio run.

## Why Browser Worker is central

The sponsor harness's `/fixture/hotel` exposes only the offer initially. Checkout is hidden until a real click. The worker uses navigation, waits, click, page/network-idle waits and two screenshot tags before parsing.

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

WebReceipt detects the inconsistent Deal Contract and requests a semantic self-heal. The live adapter treats Bright Data's `preview_result` as **untrusted**: it compiles the preview, runs all Deal Contract checks, rejects bad previews, and only approves/autosaves a repair after the preview is valid. It then reruns the collector and verifies again.

## Scraper Studio setup

1. Deploy the sponsor harness publicly.
2. Create a custom **Browser Worker**.
3. Define required `url` input using `input-schema.json` as reference.
4. Paste `interaction.js` and `parser.js`.
5. Preview V1 with the deployed `/fixture/hotel` URL.
6. Verify output fields against `output-schema.json`.
7. **Save to Production** and copy the real `c_...` Collector ID.
8. Configure the sponsor harness server-side secrets + operator token.
9. Follow `CLI_RUNBOOK.md` and save token-masked proof under `evidence/`.

Run locally before recording:

```bash
npm run verify
npm test
npm run verify:receipt -- examples/webreceipt.json
```
