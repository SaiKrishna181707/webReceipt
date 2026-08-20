# Bright Data live setup — custom Scraper Studio collector

WebReceipt has two server entry points in the current source tree:

- `npm run dev` / `npm start` launch the Next.js product UI. Its route handlers currently use the deterministic `SimulatorCollector`.
- `npm run start:brightdata` (and the provided `Dockerfile`) launch the sponsor harness in `src/server.js`. That server contains the real `BrightDataCollector`, the controlled `/fixture/hotel`, and the `/api/fixture/break` + `/api/fixture/reset` endpoints used for the real Bright Data proof.

Do not claim the Next.js console is a real Bright Data cloud run unless that wiring is changed in a later authorized task.

## 1. Deploy the sponsor harness publicly

Bright Data must be able to reach the controlled fixture over public HTTP(S):

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

In Scraper Studio → Code:

1. use a **Browser Worker**;
2. add required input `url` (`brightdata/input-schema.json` is the reference);
3. paste `brightdata/interaction.js` into Interaction;
4. paste `brightdata/parser.js` into Parser;
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

## 3. Configure the sponsor harness

Set participant-owned secrets in deployment configuration, not in git:

```text
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_COLLECTOR_ID=c_...
WEBRECEIPT_OPERATOR_TOKEN=<strong-random-secret>
```

Optional timing values are documented in `.env.example`.

Then run the sponsor harness:

```bash
npm run start:brightdata
```

There is no Bright Data live toggle in the current Next.js UI. The live proof is driven through the sponsor harness/API and `brightdata/CLI_RUNBOOK.md`.

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

That verified preview gate is the core innovation.

## 5. Public deployment guard

When Bright Data credentials exist, live/mutating endpoints are locked by default. Configure `WEBRECEIPT_OPERATOR_TOKEN` for a public sponsor deployment.

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

The repository can fully exercise simulator behavior, semantic verification, approval/rejection orchestration, mocked Bright Data API behavior, and the sponsor harness without committing secrets. A genuine Bright Data cloud create/run/self-heal still requires the participant's production Collector ID and API token and must be captured before submission.

Store token-masked proof under `evidence/` and pin the real `c_*` ID in `CLAUDE.md` only after that genuine run exists.
