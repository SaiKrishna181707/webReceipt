# WebReceipt repository guide

This file is the short operator/agent guide for reproducing the repository without overstating sponsor-backed proof.

## Non-negotiable truthfulness rules

- Do not invent a Bright Data Collector ID. A production ID must be a real `c_*` value returned by Bright Data.
- Do not commit Bright Data API tokens, operator secrets, session cookies, or unmasked credential-bearing output.
- Do not describe a simulator result as a real Bright Data cloud run. Real sponsor-backed evidence belongs under `evidence/`.
- The deployed Next.js server has a live Bright Data surface at `/api/brightdata/health`, `/api/brightdata/observe`, and `/api/brightdata/heal`, plus the real-collection bridge in `/api/observe` for healthy user-entered public URLs when Bright Data credentials are configured.
- The public `/fixture/hotel` target is the controlled checkout fixture used for the same-URL semantic-drift/self-heal proof.
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

The verified production collector is:

```text
c_mt3ha1iv1jgm8eg813
```

Set participant-owned credentials only in the deployment environment, never in git:

```text
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_COLLECTOR_ID=c_mt3ha1iv1jgm8eg813
BRIGHT_DATA_TARGET_URL=https://web-receipt-tawny.vercel.app/fixture/hotel
WEBRECEIPT_OPERATOR_TOKEN=...
```

With those values configured on the Next.js deployment, a trusted operator or coding agent can call:

```text
GET  /api/brightdata/health
POST /api/brightdata/observe
POST /api/brightdata/heal
```

The two protected POST routes require `X-WebReceipt-Operator` when `WEBRECEIPT_OPERATOR_TOKEN` is configured. The live surface remains locked by default if a Collector ID/token exist but no operator token has been set.

## Verified Bright Data evidence

A genuine Scraper Studio collector was created on 2026-08-21:

```text
Collector ID: c_mt3ha1iv1jgm8eg813
Name: webreceipt-proof-of-promise
Status: done
Target: https://web-receipt-tawny.vercel.app/fixture/hotel
```

The first real run extracted the advertised INR 8,499 price, INR 499 property fee, INR 349 service fee, INR 800 tax, and the true INR 10,147 order total. Token-free raw evidence is committed under `evidence/01-create.json` and `evidence/02-run-v1.json`.

## Remaining sponsor-proof sequence

- run the same Collector ID after the controlled V2 semantic/layout change;
- capture the incorrect/failing output separately;
- request a self-heal on `c_mt3ha1iv1jgm8eg813`;
- inspect/approve only a valid preview;
- rerun the same Collector ID and capture the healthy post-heal output;
- record the final demo commit and video.

See `evidence/README.md` for the capture format.
