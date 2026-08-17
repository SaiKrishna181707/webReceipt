# Bright Data live setup — custom Scraper Studio collector

WebReceipt's judged scraper is a **custom Bright Data Scraper Studio Browser Worker** checked into `brightdata/`. It does not rely on an existing Scrapers Library collector.

## 1. Deploy WebReceipt publicly

The controlled anonymous journey lives at:

```text
https://YOUR_DEPLOYMENT/fixture/hotel
```

Bright Data must be able to reach this URL. Localhost is intentionally only allowed in simulator/test mode.

## 2. Create the custom Browser Worker in Scraper Studio

Open Scraper Studio and create a custom scraper.

In the Code tab:

1. choose/use a **Browser Worker**;
2. add a required input parameter named `url`;
3. paste `brightdata/interaction.js` into Interaction code;
4. paste `brightdata/parser.js` into Parser code;
5. preview with the public fixture URL from `brightdata/preview-input.json`.

The interaction performs a real browser journey:

```text
navigate offer
→ wait for advertised promise
→ capture offer screenshot
→ click Continue to checkout
→ wait for checkout
→ capture checkout screenshot
→ parse
→ collect canonical observation
```

V1 must return `checkout.finalTotal: 10147`.

Scraper Studio derives the output schema from `collect()`. `brightdata/output-schema.json` documents the required nested fields and provenance fields that should be marked required before **Save to Production**.

Save the scraper to Production and copy the Collector ID (`c_...`).

## 3. Configure WebReceipt

```bash
cp .env.example .env
```

Set:

```text
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_COLLECTOR_ID=c_...
```

Run:

```bash
npm start
```

Select **Bright Data live** in the UI.

## 4. Live semantic-failure demo

1. Reset fixture to V1.
2. Run the custom production collector; WebReceipt confirms 6/6 integrity checks.
3. Break the fixture to V2 without changing its URL.
4. The old `.total-price` selector still succeeds but now extracts `₹8,499` subtotal as `finalTotal`.
5. WebReceipt detects that `8499 + 848 + 800 != 8499`.
6. WebReceipt triggers `POST /dca/collectors/{id}/refactor_template` with a semantic repair prompt.
7. Bright Data reaches `pending_answer`, its approval gate.
8. In live auto-heal mode WebReceipt mirrors the official CLI approval operation: `POST /dca/collectors/{id}/resume_automation_job` with `{ "message": true, "auto_save": true }`.
9. WebReceipt polls the refactor progress to completion, reruns the same collector ID, recompiles the Deal Contract, and accepts the recovered data only after semantic checks pass.

For a judge-facing terminal demo where you want to inspect the patch before approval, use `brightdata/CLI_RUNBOOK.md` and keep `bdata scraper heal` at its default approval gate before running `bdata scraper approve --auto-save`.

## 5. Validate before recording

```bash
npm run validate:scraper
npm test
npm run stress
```

The live Bright Data operation still requires your Bright Data account, production Collector ID, and API token. Never commit the token.
