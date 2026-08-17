# Bright Data coding-agent / CLI runbook

This is the terminal sequence for the final sponsor demo after WebReceipt is publicly deployed and the custom Browser Worker has been saved to production in Scraper Studio.

The official Bright Data CLI executable is `bdata`.

## 1. Authenticate

```bash
bdata login
```

## 2. Optional: create the initial Scraper Studio collector from your coding agent

The CLI can bootstrap a custom collector from a URL and natural-language extraction description:

```bash
bdata scraper create \
  https://YOUR_PUBLIC_WEBRECEIPT_DEPLOYMENT/fixture/hotel \
  "Traverse the public WebReceipt hotel offer into checkout. Extract advertised price, base price, mandatory fee items, taxes, final amount due, public cancellation/refund/payment terms, and evidence for each critical claim. Use a Browser Worker because checkout requires a click."
```

For the hackathon demo, open the generated collector in Scraper Studio and make the checked-in `interaction.js` + `parser.js` the canonical code, then **Save to Production**. This makes the repository and the judged collector auditable against each other.

Set the ID once:

```bash
export WEBRECEIPT_COLLECTOR=c_your_collector_id
export WEBRECEIPT_URL=https://YOUR_PUBLIC_WEBRECEIPT_DEPLOYMENT/fixture/hotel
export WEBRECEIPT_OPERATOR_TOKEN=replace-with-the-same-secret-configured-on-the-deployment
```

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

## 4. Break the controlled public website

From WebReceipt's UI press **Break website**, or:

```bash
curl -X POST https://YOUR_PUBLIC_WEBRECEIPT_DEPLOYMENT/api/fixture/break \
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

## 6. Trigger Self-Healing

```bash
bdata scraper heal "$WEBRECEIPT_COLLECTOR" \
  "WebReceipt semantic integrity failure. Preserve the current output schema and collector identity. checkout.finalTotal is returning a subtotal instead of the final amount due. Re-extract it by semantic meaning so it represents total due today and satisfies basePrice + mandatoryFees + taxes + optionalAddons - discounts. Preserve public terms and evidence. Do not add login, payment, or private-data steps." \
  --url "$WEBRECEIPT_URL" \
  --pretty
```

By default the CLI stops at Bright Data's approval gate. Review the preview/diff in the terminal or Scraper Studio UI.

## 7. Approve and save the repair

```bash
bdata scraper approve "$WEBRECEIPT_COLLECTOR" \
  --url "$WEBRECEIPT_URL" \
  --auto-save \
  --pretty
```

WebReceipt's live API adapter uses this same approval operation, but only **after** it has compiled Bright Data's `preview_result` into the Deal Contract and verified the preview. Invalid previews are rejected with `message: false`.

## 8. Verify recovery

```bash
bdata scraper run "$WEBRECEIPT_COLLECTOR" "$WEBRECEIPT_URL" --pretty
```

Expected:

```text
finalTotal = 10147
```

WebReceipt then recomputes all Deal Contract invariants and only marks the observation healthy after those checks pass.

## 9. Reset the fixture for another demo

```bash
curl -X POST https://YOUR_PUBLIC_WEBRECEIPT_DEPLOYMENT/api/fixture/reset \
  -H 'content-type: application/json' \
  -H "x-webreceipt-operator: $WEBRECEIPT_OPERATOR_TOKEN" \
  -d '{}'
```
