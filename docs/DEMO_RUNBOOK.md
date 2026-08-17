# Two-minute demo runbook

## Before recording

- `npm test` is green.
- `npm run stress` returns 7/7 recovered.
- If using Bright Data live, V1 preview is healthy and credentials are loaded.
- Browser zoom 100%; use a 1440p viewport if possible.
- Reset the app before the take.

## Sequence

**0:00–0:15 — Problem**

“Receipts remember what you paid. They don't remember what the internet promised: the price that attracted you, the mandatory fees, or the cancellation terms—and those webpages can change tomorrow.”

**0:15–0:35 — Receipt**

Generate the Ocean House receipt. Point to advertised price, final observed total, Journey Replay and the 6/6 integrity state.

**0:35–0:50 — Evidence**

Click Checkout. Show source, captured text, timestamp, DOM locator and SHA-256 evidence hash.

**0:50–1:05 — Silent break**

Click **Break website**. Explain: “The selector does not fail. It still returns a number—just the wrong number.”

**1:05–1:30 — Self-heal**

Show the integrity contradiction, heal event, rerun and recovered 6/6 checks. Emphasize that Bright Data is the repair engine and WebReceipt is the semantic acceptance gate.

**1:30–1:50 — Memory**

Click **Simulate day +3**. Show price, fee, cancellation and inclusion changes in Promise Diff.

**1:50–2:00 — Close**

“The web can change after you buy. Your receipt shouldn't. WebReceipt gives you a receipt for what the internet promised.”
