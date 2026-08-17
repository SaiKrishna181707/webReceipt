# WebReceipt custom Bright Data Scraper Studio scraper

This directory is the **custom Scraper Studio implementation** used by WebReceipt. It is not a Scrapers Library wrapper.

The hackathon requires a custom scraper created and run in Bright Data Scraper Studio, and only public web data is allowed. WebReceipt therefore uses a **Browser Worker** against an anonymous pre-payment journey and never logs in, purchases, or collects personal data.

## Files

- `interaction.js` — Browser Worker journey: navigate → capture offer → click checkout → capture final public checkout → parse → collect.
- `parser.js` — canonical WebReceipt observation parser and evidence builder.
- `output-schema.json` — Scraper Studio output schema for the structured observation.
- `preview-input.json` — preview/run input shape.
- `SELF_HEAL_PROMPT.md` — semantic repair prompt used in the demo.
- `CLI_RUNBOOK.md` — exact coding-agent / CLI workflow for create, run, heal, approve, and verify.

## Why this must be a Browser Worker

The collector uses browser-only Scraper Studio primitives:

- `navigate`
- `wait_visible`
- `click`
- `wait_network_idle`
- `wait_page_idle`
- `tag_screenshot`
- `parse`
- `collect`

The controlled demo page initially exposes only the offer. The checkout panel is revealed only after clicking **Continue to checkout**, making the browser journey a real part of data acquisition rather than a decorative choice.

## Deliberate semantic failure

For the self-healing demonstration, the initial production parser contains:

```js
const finalTotal = money('.total-price');
```

Fixture V1:

```text
.total-price = ₹10,147  // actual total due
```

Fixture V2, same URL after redesign:

```text
.total-price = ₹8,499                         // now subtotal
[data-testid="order-total"] = ₹10,147        // actual total due
```

The old selector still succeeds. Scraper Studio returns valid-looking structured data, but WebReceipt's Deal Contract Integrity engine detects that:

```text
8499 + 848 + 800 != 8499
```

That semantic contradiction triggers Scraper Studio Self-Healing. The repair prompt describes the **meaning** of `finalTotal`, not a replacement selector. After Bright Data reaches its approval gate, WebReceipt's live adapter uses the same approval endpoint as the official CLI, auto-saves the approved repair, reruns the collector, and accepts the observation only if the Deal Contract passes again.

## Scraper Studio setup

1. Deploy WebReceipt publicly.
2. Create a custom Scraper Studio collector using a **Browser Worker**.
3. In the Code tab, create a required input parameter named `url`.
4. Paste `interaction.js` into Interaction code.
5. Paste `parser.js` into Parser code.
6. Preview with `preview-input.json` after replacing the placeholder host.
7. Confirm V1 returns `checkout.finalTotal = 10147` and screenshots are captured.
8. Let Scraper Studio infer the output structure, then use `output-schema.json` as the required-field reference in the schema editor.
9. **Save to Production** and copy the Collector ID (`c_...`).
10. Configure WebReceipt with `BRIGHT_DATA_API_TOKEN` and `BRIGHT_DATA_COLLECTOR_ID`.

Validate the checked-in package locally:

```bash
npm run validate:scraper
npm test
npm run stress
```

See `CLI_RUNBOOK.md` for the live create/run/heal sequence.
