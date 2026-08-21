# WebReceipt repository guide

This file is the short operator/agent guide for reproducing the repository without overstating sponsor-backed proof.

## Non-negotiable truthfulness rules

- Do not invent a Bright Data Collector ID. A production ID must be a real `c_*` value returned by Bright Data.
- Do not commit Bright Data API tokens, operator secrets, session cookies, or unmasked credential-bearing output.
- Do not describe a simulator result as a real Bright Data cloud run. Real sponsor-backed evidence belongs under `evidence/`.
- The deployed Next.js server has a live Bright Data surface at `/api/brightdata/health`, `/api/brightdata/observe`, and `/api/brightdata/heal`, plus the real-collection bridge in `/api/observe` for healthy user-entered public URLs when Bright Data credentials are configured.
- The public `/fixture/hotel` target is the controlled checkout fixture used for the same-URL semantic-drift/self-heal proof.
- The sponsor CLI lifecycle is now genuinely proven, but do not claim the deployed `/api/brightdata/*` routes are credential-configured unless `/api/brightdata/health` confirms it on the live deployment.
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

The real sponsor lifecycle has been completed on that same Collector ID and same public URL:

1. V1 extracted advertised/base INR 8,499, INR 499 property fee, INR 349 service fee, INR 800 tax, and the true INR 10,147 order total.
2. V2 changed checkout markup/semantics; the same collector remained correct, demonstrating resilience.
3. V3 added a new required `Review final amount` interaction; the same collector genuinely failed with `parse_error: value must be finite number`.
4. `brightdata scraper heal` generated a repair and stopped at `awaiting_approval`.
5. The preview preserved all contract fields and passed `8499 + 499 + 349 + 800 = 10147`.
6. A human approved the verified proposal with `scraper approve --auto-save`.
7. The exact same Collector ID reran the exact same V3 URL and recovered INR 10,147 with journey state `Step 3 of 3 · Final amount reviewed`.

Token-free evidence is committed as:

```text
evidence/01-create.json
evidence/02-run-v1.json
evidence/03-run-after-change.json
evidence/04-run-v3-before-heal.json
evidence/05-heal-proposal.json
evidence/06-heal-approved.json
evidence/07-run-after-heal.json
evidence/MANIFEST.md
```

## Remaining submission work

- If the live product is going to demonstrate `/api/brightdata/*`, configure the Bright Data token/collector in the actual Vercel production project and verify `/api/brightdata/health` reports configured.
- Record the final demo video and submission links.
- Keep all sponsor claims tied to the committed evidence manifest.

See `evidence/README.md` for the capture format.
