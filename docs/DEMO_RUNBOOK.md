# Two-minute WebReceipt demo runbook

## Pre-flight

```bash
npm run verify
```

For sponsor-backed recording, use a public deployment, a **production custom Scraper Studio Browser Worker**, the real Collector ID/API token, and `WEBRECEIPT_OPERATOR_TOKEN`.

## 0:00–0:15 — pain

“Receipts remember what you paid. They don't remember what the internet promised.”

Show the public offer: ₹8,499, free cancellation, breakfast included.

## 0:15–0:35 — custom Scraper Studio journey

Briefly show `brightdata/interaction.js`: screenshot offer → click checkout → screenshot final public checkout → parse/collect.

Generate the receipt and show:

- advertised: ₹8,499
- final: ₹10,147
- cancellation: free until Aug 21
- evidence attached
- **11/11 integrity checks pass**

## 0:35–0:50 — provenance

Click final total. Show public URL, captured text, timestamp, screenshot, DOM evidence, evidence hash and contract hash.

## 0:50–1:05 — silent corruption

Press **Break website**. Same URL, redesigned DOM.

The old selector still returns a believable number:

```text
finalTotal = ₹8,499
```

WebReceipt shows:

```text
CONTRACT INTEGRITY FAILURE
expected ₹10,147
extracted ₹8,499
```

## 1:05–1:38 — verify the healer

This is the climax.

```text
Scraper Studio self-heal requested
→ pending_answer
→ preview_result received
→ WebReceipt compiles preview
→ 11/11 checks pass
→ ONLY NOW approve + auto-save
→ fresh production collector run
→ 11/11 checks pass again
```

Say: “Self-healing is not enough if an AI repair can silently change meaning. WebReceipt verifies the healer before shipping the fix.”

If a deliberately bad preview is shown during Q&A, WebReceipt rejects it before deployment.

## 1:38–1:52 — Promise Diff

After two real observations, use **Compare stored runs** in Bright Data live mode. In simulator mode, **Simulate day +3** is clearly labeled synthetic.

Show one before/after term or price change and its evidence.

## 1:52–2:00 — close

“WebReceipt gives you a receipt for what the internet promised you. The web can change after you buy. Your receipt shouldn't.”
