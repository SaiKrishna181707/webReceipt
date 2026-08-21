# Bright Data live setup — custom Scraper Studio collector

WebReceipt keeps the existing product UI deterministic while exposing real Bright Data integration through server-only paths.

There are two sponsor-backed entry points in the current source tree:

- `npm run dev` / `npm start` launch the Next.js product. Its existing UI route handlers remain simulator-backed, while protected `/api/brightdata/*` routes use the real `BrightDataCollector` when deployment credentials are configured.
- `npm run start:brightdata` (and the provided `Dockerfile`) launch the standalone sponsor harness in `src/server.js`. That server contains the real `BrightDataCollector`, the controlled `/fixture/hotel`, and the `/api/fixture/break` + `/api/fixture/reset` endpoints used for the complete self-healing proof.

Do not claim the Next.js `/console` walkthrough itself is a real Bright Data cloud run. Pair the unchanged UI demo with the protected live API/CLI evidence described below.

## 1. Deploy the controlled sponsor harness publicly

For the full break/heal proof, Bright Data must be able to reach the controlled fixture over public HTTP(S):

```text
https://YOUR_SPONSOR_HARNESS/fixture/hotel
```

The Dockerfile already starts the correct server:

```text
node src/server.js
```

For a direct Node deployment, the equivalent command is:

```bash
npm run start:brightdata
```

Local/private-network URLs are deliberately rejected in live mode.

## 2. Create the custom Browser Worker

From the coding agent, authenticate and create the initial Scraper Studio collector:

```bash
npx -p @brightdata/cli bdata login

npx -p @brightdata/cli bdata scraper create \
  https://YOUR_SPONSOR_HARNESS/fixture/hotel \
  "Traverse the public WebReceipt hotel offer into checkout. Extract advertised price, base price, mandatory fee items, taxes, final amount due, public cancellation/refund/payment terms, and evidence for each critical claim. Use a Browser Worker because checkout requires a click."
```

Then make the checked-in Scraper Studio package canonical:

1. use a **Browser Worker**;
2. add required input `url` (`brightdata/input-schema.json` is the reference);
3. use `brightdata/interaction.js` as Interaction;
4. use `brightdata/parser.js` as Parser;
5. preview with the deployed fixture URL;
6. use `brightdata/output-schema.json` as the required-field reference;
7. **Save to Production** and copy the real Collector ID.

The worker executes:

```text
navigate public offer
→ validate it did not redirect into login/private state or a literal local/private-network host
→ screenshot offer
→ click Continue to checkout
→ wait for checkout + network/page idle
→ screenshot checkout
→ parse
→ collect canonical observation
```

It never logs in or pays.

## 3. Configure the Next.js live bridge

Set participant-owned secrets in deployment configuration, not in git:

```text
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_COLLECTOR_ID=c_...
BRIGHT_DATA_TARGET_URL=https://YOUR_PUBLIC_SPONSOR_HARNESS/fixture/hotel
WEBRECEIPT_OPERATOR_TOKEN=<strong-random-secret>
```

Optional timing values are documented in `.env.example`.

The existing frontend does not need or receive any of these secrets. The server-only readiness endpoint is:

```bash
curl https://YOUR_NEXT_DEPLOYMENT/api/brightdata/health
```

Run the production Collector ID through WebReceipt's real Deal Contract pipeline:

```bash
curl -X POST https://YOUR_NEXT_DEPLOYMENT/api/brightdata/observe \
  -H 'content-type: application/json' \
  -H "x-webreceipt-operator: $WEBRECEIPT_OPERATOR_TOKEN" \
  -d '{"targetUrl":"https://YOUR_PUBLIC_SPONSOR_HARNESS/fixture/hotel"}'
```

This performs the same `POST /dca/trigger` → dataset polling flow as the standalone adapter and stores the resulting verified contract in the existing WebReceipt store.

## 4. Verified self-heal flow

1. Reset the sponsor fixture to V1.
2. Run the production collector: the healthy Deal Contract should pass all integrity checks.
3. Break the sponsor fixture to V2 at the same URL.
4. Legacy `.total-price` can still return `₹8,499`, now a subtotal; the real total is restructured elsewhere.
5. WebReceipt detects semantic arithmetic failure.
6. It triggers `refactor_template` with a meaning-based repair prompt.
7. Bright Data reaches the `pending_answer` approval gate and returns a `preview_result`.
8. **WebReceipt does not approve yet.** It compiles the preview into the same Deal Contract and runs all integrity checks.
9. Invalid/malformed preview → `resume_automation_job` with `{ "message": false }`.
10. Valid preview → `resume_automation_job` with `{ "message": true, "auto_save": true }`.
11. WebReceipt polls completion, reruns the same Collector ID, and requires a second valid integrity result before declaring recovery.

The protected Next.js endpoint that drives this orchestration is:

```bash
curl -X POST https://YOUR_NEXT_DEPLOYMENT/api/brightdata/heal \
  -H 'content-type: application/json' \
  -H "x-webreceipt-operator: $WEBRECEIPT_OPERATOR_TOKEN" \
  -d '{"targetUrl":"https://YOUR_PUBLIC_SPONSOR_HARNESS/fixture/hotel"}'
```

For judge-facing terminal evidence, `brightdata/CLI_RUNBOOK.md` remains the preferred explicit create/run/heal/approve sequence because it makes the Collector ID and each lifecycle step easy to capture independently.

## 5. Public deployment guard

When Bright Data credentials exist, live/paid/mutating Next.js endpoints are locked by default. Configure `WEBRECEIPT_OPERATOR_TOKEN` for any public deployment.

Only set this if you deliberately accept anonymous Bright Data spend/mutation risk:

```text
WEBRECEIPT_ALLOW_UNPROTECTED_LIVE=true
```

## 6. Local verification

```bash
npm run verify
npm test
npm run verify:receipt -- examples/webreceipt.json
```

For the judge-facing terminal sequence, see `brightdata/CLI_RUNBOOK.md`.

## Live boundary

The repository can fully exercise simulator behavior, semantic verification, approval/rejection orchestration, mocked Bright Data API behavior, the protected Next.js live bridge, and the sponsor harness without committing secrets. A genuine Bright Data cloud create/run/self-heal still requires the participant's production Collector ID and API token and must be captured before submission.

Store token-masked proof under `evidence/` and pin the real `c_*` ID in `CLAUDE.md` only after that genuine run exists.
