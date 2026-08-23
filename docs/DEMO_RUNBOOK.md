# Two-minute WebReceipt demo runbook

Use two clearly separated proof tracks. Do not present the deterministic browser walkthrough as a live Bright Data cloud run.

## Pre-flight

```bash
npm run verify
npm run verify:receipt -- examples/webreceipt.json
```

For sponsor-backed recording, deploy the sponsor harness (`npm run start:brightdata` / Dockerfile), use a production custom Scraper Studio Browser Worker, the real Collector ID/API token, and `WEBRECEIPT_OPERATOR_TOKEN`.

## Track A — product UI walkthrough (deterministic controlled fixture)

### 0:00–0:15 — pain

“Receipts remember what you paid. They don't remember what the internet promised.”

### 0:15–0:35 — healthy website

Open `/console` and run **Observe website V1**. Show:

- advertised/base: ₹8,499
- fees: ₹848
- tax: ₹800
- final: ₹10,147
- final-total selector: `.total-price`
- 11/11 integrity checks pass

The console uses a deterministic collector, but the values are scraped from generated Fixture V1 HTML. It does not write the final total directly into an observation.

### 0:35–0:50 — provenance

Click the final-total evidence. Show captured text, source URL, DOM selector, timestamp, evidence hash and contract hash.

### 0:50–1:05 — website redesign creates the failure

Run **Redesign the website**.

The fixture changes to V2. The scraper configuration does **not** change. The same `.total-price` selector still matches a valid number, but its meaning has moved:

```text
Fixture V1
.total-price  -> Total due today ₹10,147

Fixture V2
.total-price  -> Subtotal ₹8,499
order-total   -> Total due today ₹10,147
```

Nothing in WebReceipt overwrites `finalTotal`. The wrong ₹8,499 comes from scraping the changed HTML with the unchanged scraper.

WebReceipt then shows the semantic contradiction:

```text
base 8,499 + fees 848 + tax 800 = expected 10,147
scraper extracted final total = 8,499
```

### 1:05–1:35 — verify the healer

Run **Repair the scraper**. Explain the trust gate:

```text
repair proposed
→ selector moves from .total-price to [data-testid="order-total"]
→ preview_result treated as untrusted
→ Deal Contract compiled
→ 11/11 integrity checks pass
→ approve
→ fresh scrape of Fixture V2
→ 11/11 checks pass again
→ trusted
```

The collector ID stays the same across the break and repair. The UI trace makes the website version, collector ID, selector and captured text visible at each step.

### 1:35–2:00 — Promise Diff

Run **Promise Diff** and show the synthetic day+3 comparison. Keep the synthetic label explicit.

## Track B — real Bright Data sponsor proof

The protected Bright Data adapter and CLI harness use the same design rule: website change first, collector output second, Contract Integrity verification third. Record a short terminal segment using `brightdata/CLI_RUNBOOK.md`:

1. show the real `c_*` Collector ID;
2. run the public sponsor fixture;
3. change the same public fixture URL;
4. rerun the same collector and capture the resulting extraction failure/drift;
5. request Bright Data self-heal and capture the preview/diff;
6. compile and verify the preview before approval;
7. approve/autosave;
8. rerun the same `c_*` ID and show the healthy post-heal contract.

The committed `evidence/` directory contains the token-free real collector lifecycle already captured for the sponsor path. Do not claim that the browser console itself is calling the paid Bright Data API.

## Close

“When a website changes and a scraper keeps returning a plausible number with the wrong meaning, WebReceipt catches the contradiction, verifies the repair, and only then trusts the data.”
