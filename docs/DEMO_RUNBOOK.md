# Two-minute WebReceipt demo runbook

Use two clearly separated proof tracks. Do not present simulator output as a real Bright Data cloud run.

## Pre-flight

```bash
npm run verify
npm run verify:receipt -- examples/webreceipt.json
```

For sponsor-backed recording, deploy the sponsor harness (`npm run start:brightdata` / Dockerfile), use a production custom Scraper Studio Browser Worker, the real Collector ID/API token, and `WEBRECEIPT_OPERATOR_TOKEN`.

## Track A — product UI walkthrough (deterministic simulator)

### 0:00–0:15 — pain

“Receipts remember what you paid. They don't remember what the internet promised.”

### 0:15–0:35 — Deal Contract

Open `/console` and run **Observe journey**. Show:

- advertised: ₹8,499
- final: ₹10,147
- cancellation terms
- evidence attached
- all integrity checks pass

The current Next.js console uses `SimulatorCollector`; say that plainly.

### 0:35–0:50 — provenance

Click a contract field or journey stage. Show public URL, captured text, timestamp, DOM evidence, evidence hash and contract hash.

### 0:50–1:05 — silent corruption

Run **Simulate redesign**. The simulator injects the wrong-but-valid total:

```text
finalTotal = ₹8,499
```

WebReceipt shows the semantic contradiction:

```text
expected ₹10,147
extracted ₹8,499
```

### 1:05–1:35 — verify the healer

Run **Heal with Bright Data** and explain that this UI path is a deterministic simulation of the same verified-heal protocol:

```text
repair proposed
→ preview_result treated as untrusted
→ Deal Contract compiled
→ integrity checks pass
→ approve
→ fresh run
→ integrity checks pass again
```

The real sponsor proof for this sequence is Track B.

### 1:35–2:00 — Promise Diff

Run **Promise Diff** and show the synthetic day+3 comparison. Keep the synthetic label explicit.

## Track B — real Bright Data sponsor proof

Record a short terminal segment using `brightdata/CLI_RUNBOOK.md`:

1. show the real `c_*` Collector ID;
2. run V1 on the public sponsor fixture;
3. break the same public fixture URL;
4. rerun the same collector and capture the wrong-but-valid result;
5. request self-heal and capture the preview/diff;
6. verify the preview before approval;
7. approve/autosave;
8. rerun the same `c_*` ID and show the healthy post-heal result.

Save token-masked raw evidence under `evidence/`.

## Close

“WebReceipt gives you a receipt for what the internet promised you. The web can change after you buy. Your receipt shouldn't.”
