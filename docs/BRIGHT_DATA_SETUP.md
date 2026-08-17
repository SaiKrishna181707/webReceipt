# Bright Data live setup — custom Scraper Studio collector

WebReceipt's judged scraper is a **custom Bright Data Scraper Studio Browser Worker** checked into `brightdata/`. It does not rely on an existing Scrapers Library collector.

## 1. Deploy WebReceipt publicly

The deterministic public journey is:

```text
https://YOUR_DEPLOYMENT/fixture/hotel
```

Bright Data must be able to reach it. Local/private-network URLs are deliberately rejected in live mode.

## 2. Create the custom Browser Worker

In Scraper Studio → Code:

1. use a **Browser Worker**;
2. add required input `url` (`brightdata/input-schema.json` is the reference);
3. paste `brightdata/interaction.js` into Interaction;
4. paste `brightdata/parser.js` into Parser;
5. preview with the deployed fixture URL;
6. use `brightdata/output-schema.json` as the required-field reference;
7. **Save to Production** and copy the Collector ID.

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

## 3. Configure the application

```bash
cp .env.example .env
```

Set at minimum:

```text
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_COLLECTOR_ID=c_...
WEBRECEIPT_OPERATOR_TOKEN=<strong-random-secret>
```

Then:

```bash
npm start
```

Select **Bright Data live** and enter the operator key in the UI. The Bright Data API token remains server-side.

## 4. Verified self-heal flow

1. Reset to V1.
2. Run the production collector: healthy Deal Contract should pass **11/11** checks.
3. Break the fixture to V2 at the same URL.
4. Legacy `.total-price` still returns `₹8,499`, now a subtotal; the real total is restructured elsewhere.
5. WebReceipt detects semantic arithmetic failure.
6. It triggers `refactor_template` with a meaning-based repair prompt.
7. Bright Data reaches the `pending_answer` approval gate and returns a `preview_result`.
8. **WebReceipt does not approve yet.** It compiles the preview into the same Deal Contract and runs all integrity checks.
9. Invalid/malformed preview → `resume_automation_job` with `{ "message": false }` and the old collector stays unapproved.
10. Valid preview → `resume_automation_job` with `{ "message": true, "auto_save": true }`.
11. WebReceipt polls completion, reruns the same Collector ID, and requires a second valid integrity result before declaring recovery.

That is the core innovation: the healer is verified by the data contract before deployment.

## 5. Public deployment guard

When Bright Data credentials exist, live/mutating endpoints are locked by default. Configure `WEBRECEIPT_OPERATOR_TOKEN` for the final public deployment.

Only set this if you deliberately accept anonymous Bright Data spend/mutation risk:

```text
WEBRECEIPT_ALLOW_UNPROTECTED_LIVE=true
```

## 6. Final verification

```bash
npm run verify
```

For a judge-facing terminal sequence, see `brightdata/CLI_RUNBOOK.md`.

## Live boundary

The repository can fully exercise simulator, semantic verification, approval/rejection orchestration, and mocked API behavior without secrets. A genuine Bright Data cloud run still requires your own production Collector ID and API token and must be recorded before submission.
