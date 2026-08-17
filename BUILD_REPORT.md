# WebReceipt build verification report

Last full audit: **18 Aug 2026 (IST)**.

This report records what was actually executed against the current source tree. It intentionally separates local verification from cloud-only steps that require participant credentials.

## Final local verification

- `npm run verify`: **PASS**.
  - Scraper Studio package validator: **PASS**.
  - `npm test`: **57/57 passing**.
  - Chaos Checkout: **7/7 mutation scenarios resilient/recovered**.
- Deterministic monetary fuzzing: **500 internally consistent contracts accepted** and the corresponding **500 ₹1-corrupted totals rejected**.
- Test coverage (`node --test --experimental-test-coverage`):
  - **98.67% line coverage**
  - **83.16% branch coverage**
  - **97.08% function coverage**
- Persistence concurrency: **48 simultaneous observations** while preserving valid atomic JSON and retention limits.
- Restart integrity: persisted receipts are revalidated from their contract/evidence hashes and semantic rules; structurally unusable persisted records are discarded instead of trusted.
- Corrupt persistence recovery: invalid JSON state is backed up and recovered rather than crashing startup.
- Production-process smoke test (`NODE_ENV=production npm start`): **PASS**.
  - health endpoint: healthy
  - healthy receipt: **11/11 integrity checks pass**
  - wrong-but-valid semantic break: detected → preview verified → approved → fresh run verified
  - unknown mutation: HTTP **400**
  - `HEAD /`: HTTP **200**
  - encoded traversal attempt: HTTP **404**
  - exported receipt independently verifies **11/11**
- Portable artifact verification:
  - `npm run verify:receipt -- examples/webreceipt.json`: exits **0**
  - tampered evidence/contract hashes: verifier exits **non-zero**
  - semantic-failure example: verifier exits **non-zero**
- JavaScript syntax checks: **PASS** for application, test, public and script files.
- JSON parsing checks: **PASS** for every checked-in JSON artifact/schema.
- Scraper Studio function-body validation: **PASS** for `brightdata/interaction.js` and `brightdata/parser.js`.
- Git whitespace audit: `git diff --check` **clean**.
- Repository secret scan: **no committed API token, GitHub token, or private credential detected**.
- No TODO/FIXME/HACK markers remain in the submission surface.

## Custom Scraper Studio verification

The checked-in custom Browser Worker is not a placeholder. The audit verifies that it:

1. accepts a required public HTTP(S) URL;
2. rejects obvious private/local/credential-bearing/login-like targets, including encoded path-separator variants and private IPv4/IPv6 forms;
3. navigates the public offer page;
4. captures offer-stage evidence;
5. clicks into the anonymous pre-payment checkout;
6. captures checkout-stage evidence;
7. parses and collects the canonical WebReceipt observation;
8. preserves the deliberate legacy `.total-price` extractor used to demonstrate silent semantic drift;
9. never logs in, purchases, or accesses private/paywalled data.

The checked-in parser itself is executed under tests against controlled V1/V2 DOM text:

- V1 `.total-price` → **₹10,147** (correct final total)
- V2 `.total-price` → **₹8,499** (plausible but wrong subtotal)
- WebReceipt's real Deal Contract integrity engine rejects V2 via `total_arithmetic`.

## Verified repair-safety lifecycle

The live adapter and orchestration now fail closed around Bright Data's approval gate:

```text
production extraction fails semantic integrity
        ↓
trigger Scraper Studio self-heal
        ↓
pending_answer / preview_result
        ↓
compile preview into Deal Contract
        ↓
run the same semantic + evidence integrity checks
        ↓
INVALID/MALFORMED/NO PREVIEW → reject repair
VALID PREVIEW → approve + auto-save
        ↓
fresh collector run
        ↓
post-approval integrity verification
        ↓
only then mark healed
```

Tests cover valid previews, invalid previews, malformed previews, missing previews, rejection, terminal AI-flow failures, stale post-approval output, transient HTTP/network retries and concurrent repairs.

## Public-deployment hardening verified

- Bright Data live/mutating actions can be protected by `WEBRECEIPT_OPERATOR_TOKEN`.
- Bright Data API credentials remain server-side.
- Live Chaos is blocked server-side.
- Live Bright Data calls are single-flight to limit accidental spend/races.
- JSON request bodies are size bounded and malformed JSON returns a client error.
- Static serving rejects traversal and sends security headers/CSP.
- Simulator refuses arbitrary third-party targets so synthetic data cannot be presented as a real scrape.
- Target-policy rules block private network and obvious login/private routes.
- Receipt hashes are rechecked during validation, restart loading and standalone artifact verification.

## Browser / responsive audit

Judge-facing UI was exercised with deterministic API responses in Chromium at:

- **1440px desktop**: zero document-level horizontal overflow, zero page JS errors.
- **390px mobile**: zero document-level horizontal overflow, zero page JS errors.

The rendered repair state visibly communicates **preview verified → approved**, and a healthy receipt displays **11/11** integrity checks.

Direct Chromium navigation to localhost is restricted by this execution environment, so browser interaction was exercised through rendered page content + deterministic API stubs. The production HTTP server itself was separately smoke-tested over localhost with `curl`.

## Node/runtime compatibility

The project declares Node **>=20** and no longer depends on the Node 22-only `--env-file-if-exists` flag. A zero-dependency optional `.env` bootstrap is used instead. Tests cover comment/export/quoted-value parsing and environment-variable precedence.

GitHub Actions is configured to run the verification suite on **Node 20 and Node 22**.

## Not falsely claimed

### Real Bright Data cloud run

A **real Bright Data cloud collection/self-heal has not been executed from this environment** because no participant Bright Data API token or published Collector ID was provided.

To complete the sponsor-backed submission proof before judging:

1. deploy WebReceipt publicly;
2. create/publish the custom Browser Worker from `brightdata/` in Scraper Studio;
3. run it against the public `/fixture/hotel` V1 URL;
4. save it to Production and record the real `c_...` Collector ID;
5. configure `BRIGHT_DATA_API_TOKEN`, `BRIGHT_DATA_COLLECTOR_ID` and an operator token;
6. switch the fixture to V2;
7. demonstrate the real collector returning the plausible wrong total;
8. show WebReceipt detecting the semantic contradiction;
9. show the Scraper Studio repair preview being verified before approval;
10. rerun the same Collector ID and show **11/11** checks pass.

See `docs/BRIGHT_DATA_SETUP.md` and `brightdata/CLI_RUNBOOK.md`.

### Docker engine

The Dockerfile was reviewed and hardened for a non-root runtime, but a Docker daemon is **not available in this execution environment**, so a real `docker build` was not claimed. The same production Node process used by the container was started and smoke-tested directly.
