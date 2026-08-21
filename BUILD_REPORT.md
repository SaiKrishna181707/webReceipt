# WebReceipt build verification report

Last full pre-submission reliability audit: **22 Aug 2026 (IST)**.

This report records verified behavior rather than aspirational claims. Secret values are never included.

## Current verification gates

GitHub Actions runs on **Node 20 and Node 22** and executes:

```text
npm ci
npm audit --omit=dev              # reported for review; see Dependency audit
npm run verify                    # package validation + tests + chaos suite
npm run build                     # production Next.js build/type check
npm run smoke:next                # boots built app and probes production API routes
```

The stress branch currently contains **72 deterministic Node tests**. They cover the existing engine plus the real generated Bright Data output shape and Next.js request-boundary regressions found during this audit.

The deterministic Chaos Checkout suite continues to recover **7/7** scenarios:

- 4 structural/format mutations remain semantically valid without repair;
- 3 semantic/evidence failures are detected, preview-verified, repaired and rerun successfully.

The monetary fuzz suite exercises **500 internally consistent contracts** and verifies that corresponding corrupted totals fail integrity checks.

## Real Bright Data cloud proof — VERIFIED

The production Scraper Studio collector is:

```text
Collector ID: c_mt3ha1iv1jgm8eg813
Name: webreceipt-proof-of-promise
Target: https://web-receipt-tawny.vercel.app/fixture/hotel
```

The genuine cloud lifecycle is committed under `evidence/`:

1. collector creation completed;
2. V1 run extracted INR 8,499 base/advertised price, INR 499 property fee, INR 349 service fee, INR 800 tax, and INR 10,147 final total;
3. V2 layout/semantic drift was survived by the same collector;
4. V3 interaction drift caused a genuine `parse_error` (`value must be finite number`);
5. Bright Data Self-Healing generated a proposal on the **same Collector ID**;
6. the preview returned the correct INR 10,147 total and passed WebReceipt's arithmetic/integrity gate;
7. a human explicitly approved and auto-saved the repair;
8. a fresh run of the **same Collector ID against the same URL** recovered the correct INR 10,147 total.

See `evidence/01-create.json` through `evidence/07-run-after-heal.json` and `evidence/MANIFEST.md`.

## Critical production-integration issue found and fixed

The real Bright Data collector generated during the hackathon emits a flat schema such as:

```text
advertised_price
base_price
property_fee
service_fee
tax
order_total
cancellation_terms
refundability
payment_timing
inclusions
offer_name
journey_state
```

The original WebReceipt Deal Contract compiler expects its canonical nested observation schema. A successful cloud scrape could therefore have failed locally during compilation.

The production bridge now normalizes the **exact real collector shape** into the canonical WebReceipt observation before compilation. Regression tests replay the real V1 output and require:

```text
base              8499
property fee       499
service fee        349
mandatory fees     848
tax                 800
final total       10147
integrity         valid
```

The normalizer does not invent screenshots or DOM selectors. When the generated collector only provides structured fields, WebReceipt records transparent structured-output provenance with `screenshotRef`/`domPath` left null.

## Collector-failure self-healing issue found and fixed

A real V3 Bright Data failure produced a `parse_error` **before a Deal Contract could be compiled**. The older server orchestration only initiated healing after a compiled contract failed semantic integrity.

The live orchestrator now supports both repair triggers:

```text
A. structured output compiles → semantic integrity fails → heal
B. collector returns parse/error output → no contract exists → heal
```

For either path, a repair is not trusted automatically:

```text
failure
  ↓
Bright Data heal proposal
  ↓
untrusted preview
  ↓
normalize + compile preview
  ↓
run Deal Contract integrity checks
  ↓
invalid/missing preview → reject
valid preview → approve + auto-save
  ↓
fresh same-collector run
  ↓
post-heal integrity must be valid
```

If auto-heal is disabled, a collector `parse_error` fails clearly instead of manufacturing a receipt.

## Next.js production request-boundary issue found and fixed

The previous Next.js request helper swallowed malformed JSON and returned `{}`. That could turn a malformed request into an unintended default-target operation. It also had no explicit body-size cap.

The production API now:

- accepts empty bodies only where route defaults legitimately allow them;
- requires non-empty JSON bodies to be JSON objects;
- returns **400 / `invalid_json`** for malformed JSON, arrays or primitives;
- enforces a **256 KiB** streaming request limit;
- returns **413 / `body_too_large`** when exceeded;
- sanitizes unexpected production 500 messages.

The built `.next` application is smoke-tested for these exact responses rather than relying only on unit tests.

## Existing resilience/security checks retained

- Bright Data credentials are server-only and never committed.
- Verified Collector ID/target are non-secret deployment defaults; env overrides remain available for rotation.
- Anonymous browser traffic can spend Bright Data credits only on the controlled proof target by default.
- Arbitrary live public targets remain behind the protected operator API.
- Public observe never self-heals/mutates the production collector.
- Protected Bright Data observe/heal routes support `WEBRECEIPT_OPERATOR_TOKEN` and fail locked by default.
- Live Bright Data work is single-flight per warm function instance to reduce duplicate spend/races.
- Target policy rejects credential-bearing URLs, localhost/private IP ranges, obvious login/private paths, encoded path variants and non-HTTP(S) schemes.
- Bright Data calls have per-request timeouts, transient HTTP/network retries, `Retry-After` handling, collection deadlines and heal deadlines.
- Empty datasets and terminal AI-flow failures fail closed.
- Heal previews can be approved only after canonical compilation and integrity verification.
- Approved repairs require a fresh post-approval collector run before `healed=true`.
- Receipt/evidence hashes are independently recomputed during validation and reload.
- Corrupt JSON state is recovered instead of crashing startup.
- Concurrent local store writes are serialized and atomically replaced.
- Vercel automatically selects writable temporary storage so observations do not fail on the deployment filesystem.

## Vercel state boundary

Vercel function-local state is intentionally **best-effort and ephemeral**. `/tmp` prevents filesystem-write failures, but receipt/history state is not guaranteed across cold starts or different function instances.

This does not affect the independently committed Bright Data evidence or the correctness of a single observation. A durable product deployment should replace the JSON store with Postgres/KV/Redis or another persistent store.

## Dependency audit

`npm audit --omit=dev` currently reports high-severity advisories through the installed Next.js 14 line and its bundled PostCSS. npm's automated remediation requires a breaking Next.js major upgrade.

The audit was reviewed rather than hidden. The repository does **not** use the application features named by the principal current advisories checked during this pass:

- no Server Actions / `use server`;
- no `next/image` Image Optimizer usage;
- no `rewrites()`/dynamic external hostname rules;
- no middleware/proxy layer;
- no CSP nonce / `beforeInteractive` pattern;
- WebReceipt's server-side Bright Data requests use `fetch(url, options)`, not the vulnerable cache-confusion pattern involving a `Request` object plus a different init.

A forced Next 14 → 15/16 migration immediately before judging was therefore not performed. The production audit remains visible in CI and a framework major-version upgrade should be the first post-hackathon maintenance task.

## Submission status

The technical sponsor proof is complete. Before the live presentation, the remaining deployment action is operational rather than code-related:

1. set `BRIGHT_DATA_API_TOKEN` in the correct Production Vercel project;
2. optionally set a strong `WEBRECEIPT_OPERATOR_TOKEN` for protected live APIs;
3. redeploy;
4. confirm `/api/brightdata/health` reports `brightdata-ready` and the verified Collector ID;
5. run the controlled fixture through the existing console.

No frontend/UI changes were made during this production stress audit.
