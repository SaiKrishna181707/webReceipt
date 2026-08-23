# Bright Data coding-agent / CLI runbook

This is the terminal sequence for the real sponsor-backed demo after the WebReceipt **sponsor harness** is publicly deployed and the custom Browser Worker has been saved to Production in Scraper Studio.

The sponsor harness is `src/server.js`, launched by `npm run start:brightdata` or by the provided Dockerfile. The current Next.js UI is simulator-backed and does not expose the `/api/fixture/break` or `/api/fixture/reset` endpoints used below.

`@brightdata/cli` installs two interchangeable executables — `brightdata` and
`bdata` — both pointing at the same entrypoint. This runbook uses `bdata`
throughout. Captured evidence in `evidence/` shows both names because the
operator used them interchangeably; they are the same tool, not two tools.

## 1. Authenticate

```bash
bdata login
```

## 2. Create or publish the custom collector

The CLI can bootstrap a custom collector from a URL and natural-language extraction description:

```bash
bdata scraper create \
  https://YOUR_PUBLIC_SPONSOR_HARNESS/fixture/hotel \
  "Traverse the public WebReceipt hotel offer into checkout. Extract advertised price, base price, mandatory fee items, taxes, final amount due, public cancellation/refund/payment terms, and evidence for each critical claim. Use a Browser Worker because checkout requires a click."
```

For the judged collector, open the generated collector in Scraper Studio and make the checked-in `interaction.js` + `parser.js` the canonical code, then **Save to Production**.

Set the real values once:

```bash
export WEBRECEIPT_COLLECTOR=c_your_real_collector_id
export WEBRECEIPT_URL=https://YOUR_PUBLIC_SPONSOR_HARNESS/fixture/hotel
export WEBRECEIPT_OPERATOR_TOKEN=replace-with-the-same-secret-configured-on-the-deployment
```

Do not replace `WEBRECEIPT_COLLECTOR` with a fabricated example in submission evidence.

## 3. Run V1

```bash
bdata scraper run "$WEBRECEIPT_COLLECTOR" "$WEBRECEIPT_URL" --pretty
```

Expected critical result:

```text
advertisedPrice = 8499
basePrice       = 8499
mandatoryFees   = 848
taxes           = 800
finalTotal      = 10147
```

Capture the token-masked result under `evidence/`.

## 4. Break the controlled public website

This endpoint exists on the sponsor harness, not the Next.js product server:

```bash
curl -X POST https://YOUR_PUBLIC_SPONSOR_HARNESS/api/fixture/break \
  -H 'content-type: application/json' \
  -H "x-webreceipt-operator: $WEBRECEIPT_OPERATOR_TOKEN" \
  -d '{}'
```

The URL remains unchanged, but `.total-price` now means subtotal.

## 5. Prove wrong-but-valid extraction

```bash
bdata scraper run "$WEBRECEIPT_COLLECTOR" "$WEBRECEIPT_URL" --pretty
```

The initial parser can still return `finalTotal = 8499`. WebReceipt rejects that output semantically even though the scraper did not throw.

Capture this failing run separately from the V1 result.

## 6. Trigger Self-Healing

```bash
bdata scraper heal "$WEBRECEIPT_COLLECTOR" \
  "WebReceipt semantic integrity failure. Preserve the current output schema and collector identity. checkout.finalTotal is returning a subtotal instead of the final amount due. Re-extract it by semantic meaning so it represents total due today and satisfies basePrice + mandatoryFees + taxes + optionalAddons - discounts. Preserve public terms and evidence. Do not add login, payment, or private-data steps." \
  --url "$WEBRECEIPT_URL" \
  --pretty
```

By default the CLI stops at Bright Data's approval gate. Review and capture the preview/diff.

## 7. Approve and save the repair

Only approve a proposal that has passed WebReceipt's Deal Contract verification gate:

```bash
bdata scraper approve "$WEBRECEIPT_COLLECTOR" \
  --url "$WEBRECEIPT_URL" \
  --auto-save \
  --pretty
```

The live adapter performs the equivalent approval operation only after validating `preview_result`. Invalid previews are rejected.

## 8. Verify recovery

```bash
bdata scraper run "$WEBRECEIPT_COLLECTOR" "$WEBRECEIPT_URL" --pretty
```

Expected:

```text
finalTotal = 10147
```

WebReceipt recomputes the Deal Contract invariants and only marks the observation healthy after those checks pass. Save this run as the post-heal evidence.

## 9. Reset the fixture for another demo

```bash
curl -X POST https://YOUR_PUBLIC_SPONSOR_HARNESS/api/fixture/reset \
  -H 'content-type: application/json' \
  -H "x-webreceipt-operator: $WEBRECEIPT_OPERATOR_TOKEN" \
  -d '{}'
```

## 10. Evidence manifest

Before submission, add token-masked artifacts under `evidence/` for create/publish, V1, failing run, heal proposal/approval, and post-heal V2. See `evidence/README.md`.
