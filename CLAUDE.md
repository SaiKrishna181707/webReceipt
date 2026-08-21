# WebReceipt repository guide

This file is the short operator/agent guide for reproducing the repository without overstating sponsor-backed proof.

## Non-negotiable truthfulness rules

- Do not invent a Bright Data Collector ID. A production ID must be a real `c_*` value returned by Bright Data.
- Do not commit Bright Data API tokens, operator secrets, session cookies, or unmasked credential-bearing output.
- Do not describe the Next.js `/console` flow as a real Bright Data cloud run. The product UI intentionally remains backed by `SimulatorCollector` so the visual demo is deterministic.
- The deployed Next.js server now has a separate protected live Bright Data surface at `/api/brightdata/health`, `/api/brightdata/observe`, and `/api/brightdata/heal`. These routes reuse the real `BrightDataCollector`, Deal Contract compiler, integrity gate, and receipt store without changing the frontend.
- The standalone sponsor harness (`npm run start:brightdata` or the provided `Dockerfile`) remains the controlled public fixture used for the complete break/reset/self-heal proof in `brightdata/CLI_RUNBOOK.md`.
- Preserve the existing product UI and runtime behavior unless a task explicitly authorizes changing them.

## Local setup

```bash
npm install
npm run dev
```

The Next.js UI is available at `http://localhost:3000`.

## Verification

```bash
npm run verify
npm test
npm run verify:receipt -- examples/webreceipt.json
```

The semantic-failure sample is expected to fail standalone verification:

```bash
npm run verify:receipt -- examples/semantic-failure.json
```

## Bright Data live setup

Set the real participant-owned credentials in the environment, never in git:

```text
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_COLLECTOR_ID=c_...
BRIGHT_DATA_TARGET_URL=https://PUBLIC_TARGET
WEBRECEIPT_OPERATOR_TOKEN=...
```

With those values configured on the Next.js deployment, a trusted operator or coding agent can call:

```text
GET  /api/brightdata/health
POST /api/brightdata/observe
POST /api/brightdata/heal
```

The two POST routes require `X-WebReceipt-Operator` when `WEBRECEIPT_OPERATOR_TOKEN` is configured. The live surface remains locked by default if a Collector ID/token exist but no operator token has been set.

For the controlled self-healing demonstration, run the sponsor harness:

```bash
npm run start:brightdata
```

This server exposes the same live Bright Data adapter plus `/fixture/hotel`, `/api/fixture/break`, and `/api/fixture/reset`. The Dockerfile launches the same server.

## Production Collector ID status

No verified production `c_*` Collector ID is committed to this repository yet. This is intentionally not replaced with an example value.

After a genuine Bright Data create/publish/run flow:

1. record the real Collector ID here;
2. keep the secret token only in deployment secrets;
3. save token-masked raw run evidence under `evidence/`;
4. update the judge/demo docs only with claims supported by those artifacts.

## External proof still required for sponsor-backed judging

- a genuine custom collector create/publish event;
- at least one real V1 run;
- a real failing run after a layout/semantic change;
- a real self-heal preview/approval;
- a real post-heal run on the same Collector ID;
- the final demo video.

See `evidence/README.md` for the capture format.
