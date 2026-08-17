# WebReceipt — Proof of Promise

> Receipts remember what you paid. **WebReceipt remembers what the internet promised.**

WebReceipt is a self-healing evidence layer for the mutable commercial web. A custom Bright Data Scraper Studio **Browser Worker** traverses a public anonymous offer → checkout journey, captures evidence, and emits a canonical **Deal Contract**. WebReceipt then verifies the economics, provenance, and hashes instead of trusting “the scraper returned JSON.”

Built for **Into the Scrape-Verse · WeMakeDevs × Bright Data · Aug 17–23, 2026**.

## The problem

Online receipts preserve the transaction, not the offer that caused it. Prices, mandatory charges, cancellation promises, refund terms, and inclusions live on mutable webpages. A normal scraper monitor also misses the dangerous failure mode where a selector still matches but now means something else.

WebReceipt creates a reproducible observation:

1. traverse a **public, anonymous** commercial journey;
2. capture offer + checkout provenance;
3. compile everything into one normalized Deal Contract;
4. enforce deterministic semantic and integrity invariants;
5. when extraction drifts, ask Scraper Studio for a repair proposal;
6. **verify the repair preview before approving it**;
7. approve/save only a valid preview, then rerun and verify again;
8. compare later observations as a Promise Diff.

WebReceipt reports observed behavior, not legal conclusions.

## The failure that matters

The demo does not rename `.price` to `.new-price`.

Fixture V1:

```text
.total-price = ₹10,147  // final total
```

Fixture V2 keeps the legacy selector alive, but changes its meaning and restructures the real total:

```text
.total-price = ₹8,499  // now subtotal, still valid-looking
[data-testid="order-total"] → nested ₹ + 10,147 nodes
```

The old collector can return perfectly valid JSON:

```json
{"basePrice":8499,"mandatoryFees":848,"taxes":800,"finalTotal":8499}
```

WebReceipt catches the contradiction:

```text
8499 + 848 + 800 = 10147 ≠ 8499
CONTRACT INTEGRITY FAILURE
```

The strongest part is the recovery gate:

```text
semantic failure
      ↓
Scraper Studio self-heal proposal
      ↓
preview_result (UNTRUSTED)
      ↓
compile into Deal Contract
      ↓
run all semantic + provenance + hash checks
      ↓
   valid? ── no ──→ reject repair
      │
     yes
      ↓
approve + auto-save
      ↓
fresh collector run
      ↓
verify again
```

So WebReceipt does not merely use self-healing. **It refuses to deploy a proposed repair until its preview passes the same Deal Contract checks.**

## Architecture

```text
Public anonymous journey
        │
        ▼
Bright Data Scraper Studio
Custom Browser Worker
  offer screenshot
  click checkout
  checkout screenshot
  parse + collect
        │
        ▼
Canonical Deal Contract
        │
        ├── price arithmetic
        ├── fee breakdown
        ├── currency consistency
        ├── evidence completeness
        ├── evidence hash verification
        ├── contract hash verification
        └── journey/evidence linkage
        │
   ┌────┴────┐
 VALID     INVALID
   │          │
   │          ▼
   │   Scraper Studio self-heal
   │          │
   │          ▼
   │   preview verification gate
   │      ┌───┴───┐
   │    reject  approve/save
   │               │
   │               ▼
   │          fresh collector run
   │               │
   └───────────────┤
                   ▼
           Versioned evidence
          Journey Replay / Diff
```

## Implemented

- Custom Scraper Studio Browser Worker package in `brightdata/`.
- Required `url` input schema + nested output-schema reference.
- Real offer → click → checkout interaction with two screenshots.
- Canonical Deal Contract schema `1.1.0`.
- SHA-256 evidence hashes + whole-contract hash, reverified on validation, restart, and portable receipt verification.
- **11 deterministic integrity checks** on a healthy contract.
- Wrong-but-valid semantic failure detection.
- Self-heal proposal → preview verification → approve/reject → fresh-run verification.
- Bright Data Collection API + AI Flow integration with retry, request timeouts, long heal timeout, approval/rejection, and autosave.
- Journey Replay, evidence viewer, Deal Anomalies, Promise Diff, repair timeline.
- Real stored-history diff for live observations; synthetic day+3 diff is explicitly simulator-only.
- Chaos Checkout with seven deterministic scenarios.
- Public-target policy and login/private-path guardrails.
- Public-deployment operator protection for Bright Data credit-consuming/mutating actions.
- CSP/security headers, bounded JSON requests, safe attachment filenames, atomic state persistence, corrupt-state recovery.
- Dockerfile configured for a non-root runtime and GitHub Actions verification on Node 20 + 22.
- Zero npm runtime dependencies.

## Custom Scraper Studio package

```text
brightdata/
├── input-schema.json
├── interaction.js
├── parser.js
├── output-schema.json
├── preview-input.json
├── SELF_HEAL_PROMPT.md
├── CLI_RUNBOOK.md
└── README.md
```

Validate it independently:

```bash
npm run validate:scraper
```

## Run locally

Requires Node.js 20+.

```bash
npm start
# http://localhost:3000
```

Full verification:

```bash
npm run verify
```

`npm run verify` runs the Scraper Studio package validator, automated tests, and Chaos Checkout.

Verify any exported receipt independently instead of trusting a stored UI verdict:

```bash
npm run verify:receipt -- examples/webreceipt.json
```

The verifier recomputes semantic invariants, evidence hashes, and the whole-contract hash from the artifact itself and exits non-zero if verification fails.

### Simulator honesty boundary

Simulator mode is intentionally restricted to the controlled WebReceipt fixture/demo target. It will **not** pretend that it scraped an arbitrary third-party URL. To observe a real public URL, use a real custom Scraper Studio collector in **Bright Data live** mode.

## Controlled public failure lab

When deployed publicly, `/fixture/hotel` is a two-stage anonymous browser journey. Checkout is hidden until **Continue to checkout** is clicked. The same URL can switch from V1 to V2, giving the judges a deterministic real-browser redesign without waiting for a third-party site to change during the demo.

The controlled fixture is the failure laboratory. For final judging, also adapt/run the same Deal Contract semantics against at least one real public lodging journey if the target’s terms permit it.

## Connect Bright Data live

1. Deploy WebReceipt publicly.
2. Create a **custom Browser Worker** in Scraper Studio.
3. Configure required `url` input using `brightdata/input-schema.json` as reference.
4. Paste `brightdata/interaction.js` and `brightdata/parser.js`.
5. Preview V1 and verify the output using `brightdata/output-schema.json`.
6. **Save to Production** and copy the `c_...` Collector ID.
7. Configure server-side secrets:

```bash
cp .env.example .env
# set BRIGHT_DATA_API_TOKEN
# set BRIGHT_DATA_COLLECTOR_ID
# set WEBRECEIPT_OPERATOR_TOKEN for any public deployment
npm start
```

The app uses:

- `POST /dca/trigger?collector=...&queue_next=1`
- `GET /dca/dataset?id=...`
- `POST /dca/collectors/{id}/refactor_template`
- `GET /dca/collectors/{id}/refactor_template/progress`
- `POST /dca/collectors/{id}/resume_automation_job`

A live repair is requested with automatic approval **off**. WebReceipt evaluates `preview_result`; only a valid preview gets `{message:true, auto_save:true}`. Invalid/malformed previews are sent `{message:false}`.

See `docs/BRIGHT_DATA_SETUP.md` and `brightdata/CLI_RUNBOOK.md`.

## Public-deployment protection

If Bright Data credentials are configured, live/mutating actions are locked unless either:

```text
WEBRECEIPT_OPERATOR_TOKEN=<strong random secret>     # recommended
```

or you explicitly opt out with:

```text
WEBRECEIPT_ALLOW_UNPROTECTED_LIVE=true              # unsafe public demo mode
```

The API token never goes to the browser. The optional operator key is sent only as `X-WebReceipt-Operator` for protected app actions and kept in browser `sessionStorage`.

## Chaos Checkout

| Scenario | What WebReceipt proves |
|---|---|
| CSS rename | structured semantics remain stable |
| DOM relocation | layout movement does not change the contract |
| split price nodes | normalization keeps the same numeric meaning |
| currency formatting | formatting change keeps the same amount |
| wrong-but-valid total | semantic arithmetic catches silent corruption → preview verify → heal |
| new mandatory fee | arithmetic + fee breakdown catch incompatible extraction → preview verify → heal |
| missing critical evidence | provenance rule rejects evidence loss → preview verify → heal |

The first four are deterministic **post-extraction semantic fixtures**; the V1→V2 `/fixture/hotel` path is the actual browser/DOM mutation used for the sponsor demo.

## Data and policy boundary

WebReceipt is intentionally limited to publicly available, anonymous web data. It does not log in, submit payment, collect personal information, bypass paywalls, or claim a legal violation. See `SECURITY.md`.

## Repository map

```text
public/                    judge-facing SPA
src/domain/                contract, hashes, invariants, diff, anomalies
src/integrations/          Bright Data + deterministic simulator
src/services/              repair orchestration + persistent history
src/fixtures/              adversarial structured observations
brightdata/                custom Scraper Studio Browser Worker package
scripts/                   scraper-package + portable receipt verification
examples/                  sample healthy + silent-failure outputs
test/                      unit, adapter, orchestration, HTTP, fuzz tests
docs/                      architecture + live/demo runbooks
.github/workflows/          Node 20/22 verification CI
```

## Two-minute demo

1. **0:00–0:15** — “Receipts remember what you paid, not what the internet promised.”
2. **0:15–0:35** — Run the custom Browser Worker; show Journey Replay + Deal Contract.
3. **0:35–0:50** — Open evidence: source, timestamp, screenshot, DOM, SHA-256.
4. **0:50–1:05** — Break V1→V2. Legacy selector still returns ₹8,499.
5. **1:05–1:35** — Integrity failure → Scraper Studio proposal → **preview passes 11/11 before approval** → approve/save → fresh run passes 11/11.
6. **1:35–1:52** — Promise Diff between receipts.
7. **1:52–2:00** — “The web can change after you buy. Your receipt shouldn’t.”

## Official references

- Hackathon rules: https://www.wemakedevs.org/hackathons/scrape-verse/rules
- Hackathon resources: https://www.wemakedevs.org/hackathons/scrape-verse/resources
- Scraper Studio functions: https://docs.brightdata.com/datasets/scraper-studio/functions
- Scraper Studio API quickstart: https://docs.brightdata.com/datasets/scraper-studio/quickstart
- Bright Data CLI: https://github.com/brightdata/cli

## AI disclosure

AI coding assistance was used during implementation. The repository includes the architecture, constraints, deterministic rules, adversarial tests, Scraper Studio source, integration behavior, and verification report so the participant can inspect and explain the submitted system.

## License

MIT.
