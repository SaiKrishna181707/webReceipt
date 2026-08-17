# WebReceipt build verification report

Generated during the Aug 17, 2026 hackathon build.

## Executed locally

- `npm test`: **23/23 passing**.
- Chaos Checkout: **7/7 mutation scenarios recovered**.
- Monetary fuzzing: **500 healthy contracts accepted + 500 ₹1-corrupted totals rejected**.
- Persistence concurrency: **24 simultaneous observations**, valid atomic JSON, retention cap preserved.
- HTTP end-to-end: reset → semantic break → heal → export → stress.
- Controlled fixture: V1/V2 verified to keep `.total-price` alive while changing it from final total to subtotal.
- Repeatability: the same semantic break can be injected and recovered multiple times.
- Bright Data adapter: trigger/poll behavior, self-heal polling, transient retry, empty dataset handling and missing-credential failure all executed using deterministic mocked HTTP responses matching the documented API contract.
- JavaScript syntax check: all application/test files pass `node --check`.
- Scraper Studio snippets: `interaction.js` and `parser.js` parse successfully as JavaScript function bodies.
- JSON examples/package metadata parse successfully.
- Git whitespace audit: `git diff --check` clean.

## Not falsely claimed

A **real Bright Data cloud run was not executed in this environment** because no user API token or published Collector ID was provided. To finish that verification:

1. deploy WebReceipt publicly;
2. create/publish the custom Browser Worker from `brightdata/`;
3. set `BRIGHT_DATA_API_TOKEN` and `BRIGHT_DATA_COLLECTOR_ID`;
4. select **Bright Data live**;
5. Generate receipt against `/fixture/hotel` (V1);
6. press **Break website** (V2), then verify the actual Self-Healing run restores 6/6 contract checks.

See `docs/BRIGHT_DATA_SETUP.md` for the exact runbook.
