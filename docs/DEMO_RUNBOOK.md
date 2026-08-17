# Two-minute WebReceipt demo runbook

## Pre-flight

```bash
npm run validate:scraper
npm test
npm run stress
```

For the sponsor-backed recording, deploy publicly, save the checked-in Browser Worker to Scraper Studio Production, configure the real Collector ID/API token, and use **Bright Data live** mode.

## 0:00–0:15 — problem

“Receipts remember what you paid. They don't remember what the internet promised.”

Show the public hotel offer: ₹8,499, free cancellation, breakfast included.

## 0:15–0:35 — custom Scraper Studio journey

Show the custom Browser Worker briefly: it captures the offer, clicks **Continue to checkout**, captures the public checkout, and returns the canonical observation.

Generate a receipt. Show Journey Replay and the Deal Contract:

- advertised: ₹8,499
- final: ₹10,147
- cancellation: free until Aug 21
- evidence attached
- 6/6 semantic checks pass

## 0:35–0:50 — provenance

Click final total. Show captured text, public source URL, timestamp, checkout screenshot reference, DOM evidence, and SHA-256 evidence hash.

## 0:50–1:05 — silent corruption

Press **Break website**. The same URL changes structure.

The old selector still returns a number:

```text
finalTotal = ₹8,499
```

Then reveal:

```text
CONTRACT INTEGRITY FAILURE
Expected ₹10,147
Extracted ₹8,499
```

## 1:05–1:35 — Bright Data self-heal

Show the semantic heal prompt. Do not tell the healer a replacement selector.

Show Bright Data's approval preview/diff, approve/save it, and rerun the same Collector ID.

Result:

```text
finalTotal = ₹10,147
6 / 6 contract checks passed
```

The important line: “The scraper did not fail. It lied plausibly. WebReceipt caught the semantic corruption, and Scraper Studio repaired the collector.”

## 1:35–1:52 — Promise Diff

Show a later observation:

```diff
- Free cancellation until Aug 21
+ Non-refundable
```

Click through to before/after evidence.

## 1:52–2:00 — close

“WebReceipt gives you a receipt for what the internet promised you. The web can change after you buy. Your receipt shouldn't.”
