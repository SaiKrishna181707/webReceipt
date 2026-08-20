# WebReceipt repository guide

This file is the short operator/agent guide for reproducing the repository without overstating sponsor-backed proof.

## Non-negotiable truthfulness rules

- Do not invent a Bright Data Collector ID. A production ID must be a real `c_*` value returned by Bright Data.
- Do not commit Bright Data API tokens, operator secrets, session cookies, or unmasked credential-bearing output.
- Do not describe the Next.js `/console` flow as a real Bright Data cloud run. In the current source tree, the Next route handlers use `SimulatorCollector`.
- The real Bright Data adapter is exercised by the sponsor harness (`npm run start:brightdata` or the provided `Dockerfile`) and the CLI workflow in `brightdata/CLI_RUNBOOK.md`.
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

## Bright Data sponsor harness

Set the real participant-owned credentials in the environment, never in git:

```text
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_COLLECTOR_ID=c_...
WEBRECEIPT_OPERATOR_TOKEN=...
```

Then run:

```bash
npm run start:brightdata
```

This server exposes the live Bright Data adapter plus the controlled `/fixture/hotel`, `/api/fixture/break`, and `/api/fixture/reset` endpoints used by the sponsor demo. The Dockerfile launches the same server.

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
