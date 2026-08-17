# WebReceipt build verification report

Updated Aug 18, 2026 after hardening the submission against the official Into the Scrape-Verse rules/resources and Bright Data Scraper Studio/CLI behavior.

## Custom Scraper Studio package

The repository now contains a complete custom Browser Worker package under `brightdata/`:

- `interaction.js` — real offer → click → checkout browser journey;
- `parser.js` — canonical structured WebReceipt observation + evidence;
- `output-schema.json` — nested Scraper Studio output schema reference;
- `preview-input.json` — preview/run input;
- `SELF_HEAL_PROMPT.md` — meaning-based semantic repair prompt;
- `CLI_RUNBOOK.md` — coding-agent/CLI create, run, heal, approve, verify sequence.

The interaction uses Browser Worker-only primitives including `click`, `wait_visible`, `wait_network_idle`, `wait_page_idle`, and `tag_screenshot`. The controlled fixture therefore cannot be collected as the complete journey by simply reading its initial static markup.

## Executed locally

- `npm run validate:scraper`: **PASS**.
- `npm test`: **28/28 passing**.
- Chaos Checkout: **7/7 mutation scenarios recovered**.
- Monetary fuzzing: **500 healthy contracts accepted + 500 ₹1-corrupted totals rejected**.
- Persistence concurrency: **24 simultaneous observations**, valid atomic JSON, retention cap preserved.
- HTTP end-to-end: reset → semantic break → heal → export → stress.
- Controlled fixture: V1/V2 verified to keep `.total-price` alive while changing it from final total to subtotal.
- Browser journey smoke test using headless Chromium + Playwright `set_content`: offer visible → checkout initially hidden → click reveals checkout in both V1 and V2; V2 retains `.total-price = ₹8,499` while `[data-testid="order-total"] = ₹10,147`.
- Bright Data adapter: trigger/poll behavior, `pending_answer` approval gate, `resume_automation_job`, `auto_save`, manual-preview mode, transient retry, empty dataset handling, and missing-credential failure all executed with deterministic mocked HTTP responses matching the official CLI/API behavior.
- JavaScript syntax check: application/test/scripts plus Scraper Studio function bodies pass syntax validation.
- JSON schema/input/package metadata parse successfully.
- `git diff --check`: clean.

## Important live boundary

A **real Bright Data cloud collector was not created or run from this environment** because `BRIGHT_DATA_API_TOKEN` and `BRIGHT_DATA_COLLECTOR_ID` are not configured here. No fake sponsor run is claimed.

To finish the sponsor-backed verification:

1. deploy WebReceipt publicly;
2. create/open a custom Scraper Studio **Browser Worker**;
3. paste `brightdata/interaction.js` and `brightdata/parser.js`;
4. add required `url` input and verify the output schema;
5. preview against the deployed `/fixture/hotel`;
6. Save to Production and copy the Collector ID;
7. configure `BRIGHT_DATA_API_TOKEN` + `BRIGHT_DATA_COLLECTOR_ID`;
8. run V1, break to V2, trigger Self-Healing, approve/save the repair, and confirm the same collector returns a semantically valid Deal Contract again.

See `docs/BRIGHT_DATA_SETUP.md` and `brightdata/CLI_RUNBOOK.md`.
