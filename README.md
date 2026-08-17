# WebReceipt — Proof of Promise

> Receipts remember what you paid. **WebReceipt remembers what the internet promised.**

WebReceipt is a self-healing evidence layer for the mutable commercial web. It traverses a **public, anonymous** offer/checkout journey, compiles prices and terms into a canonical **Deal Contract**, attaches tamper-evident provenance to critical claims, verifies semantic integrity, and triggers Bright Data Scraper Studio self-healing when a site redesign makes extraction silently wrong.

Built for **Into the Scrape-Verse · WeMakeDevs × Bright Data · Aug 17–23, 2026**.

## Why this exists

Online receipts preserve the transaction, not the offer that caused it. An advertised price, mandatory fee, cancellation promise, refund term, or inclusion can be edited after the fact. Screenshots are fragmented and ordinary scraper monitoring misses the most dangerous failure mode: **plausible but incorrect structured data**.

WebReceipt creates a reproducible observation instead:

1. follow a public commercial journey;
2. compile it into one normalized Deal Contract;
3. attach URL/text/screenshot/timestamp/collector provenance;
4. enforce deterministic semantic invariants;
5. self-heal the scraper if those invariants fail;
6. compare later observations as a Promise Diff.

WebReceipt reports **observed behavior**, not legal conclusions.

## The DGX demo

The deliberate failure is not `.price → .new-price`.

A redesigned checkout leaves the old selector alive, but it now points to the **subtotal**. The collector returns perfectly valid JSON:

```json
{"base_price": 8499, "mandatory_fees": 848, "taxes": 800, "final_total": 8499}
```

WebReceipt catches the semantic contradiction:

```text
8499 + 848 + 800 = 10147 ≠ 8499
CONTRACT INTEGRITY FAILURE
```

The orchestrator generates a meaning-based repair prompt, invokes Bright Data's Self-Healing flow, reruns the collector, and only accepts the recovered result after the contract checks pass.

## Architecture

```text
Public journey URL
      │
      ▼
Bright Data Scraper Studio (custom Browser Worker)
      │
      ├── Offer observation
      ├── Checkout observation
      ├── Public terms
      └── screenshots / source evidence
      │
      ▼
Evidence Engine ── SHA-256 per evidence record
      │
      ▼
Deal Contract Compiler
      │
      ▼
Contract Integrity Engine
      │
  ┌───┴────┐
 VALID   INVALID
  │         │
  │         ▼
  │     Self-Heal
  │         │
  │       Retest
  └────┬────┘
       ▼
Version History
  ┌────┴─────┐
Journey    Promise
Replay       Diff
```

## Features implemented

- Canonical Deal Contract schema.
- Evidence hashing and contract hashing with deterministic serialization.
- Journey Replay UI.
- Deal Anomaly reporting (observable facts, not accusations).
- Promise Diff between observations.
- Deterministic integrity engine:
  - total arithmetic;
  - fee-breakdown arithmetic;
  - currency consistency;
  - journey plausibility after explicit discounts;
  - critical evidence completeness;
  - comparable journey endpoints.
- Bright Data Collection API adapter.
- Bright Data AI Flow Self-Healing adapter.
- Deterministic simulator with the same collector interface for credential-free development.
- Chaos Checkout stress suite with seven redesign/mutation scenarios.
- JSON evidence export.
- Public-target guardrail for obvious credential/private paths.
- File-backed demo history and event timeline.
- Unit, orchestration, adapter and HTTP end-to-end tests.

## Chaos Checkout scenarios

| Mutation | Expected behavior |
|---|---|
| CSS rename | scraper semantics survive |
| DOM relocation | scraper semantics survive |
| split price nodes | normalization survives |
| currency format | normalization survives |
| wrong-but-valid total | integrity detects → heal → retest |
| new mandatory fee | arithmetic + fee breakdown detect → heal → retest |
| missing critical evidence | provenance rule detects → heal → retest |

Run it:

```bash
npm run stress
```

## Run locally

Requires Node.js 20+ and has **zero npm runtime dependencies**.

```bash
npm start
# open http://localhost:3000
```

Test everything:

```bash
npm test
```

The app starts in deterministic simulator mode, so the entire demo—including semantic failure and recovery—works without credentials.

### Controlled live fixture

The server also exposes `/fixture/hotel`. V1 and V2 share the **same URL** but intentionally change DOM semantics. `POST /api/fixture/break` switches to V2; `POST /api/fixture/reset` switches back to V1. Once WebReceipt is publicly deployed, the checked-in Scraper Studio parser can crawl that endpoint and produce a real Bright Data self-healing demo.

## Connect the real Bright Data collector

1. Create a **custom** Scraper Studio scraper for a public lodging target.
2. Use a Browser Worker for JS/click/wait/screenshot flows.
3. Save the collector to production.
4. Map its output to the observation shape consumed by `compileDealContract()`.
5. Copy `.env.example` to `.env` or export:

```bash
export BRIGHT_DATA_API_TOKEN="..."
export BRIGHT_DATA_COLLECTOR_ID="c_..."
npm start
```

6. Choose **Bright Data live** in the UI.

The real adapter implements:

- `POST /dca/trigger?collector=...&queue_next=1`
- polling `GET /dca/dataset?id=...`
- `POST /dca/collectors/{collector_id}/refactor_template`
- polling `GET /dca/collectors/{collector_id}/refactor_template/progress`

`brightdata/interaction.js` is a checked-in Browser Worker starter using the official `navigate`, `wait_network_idle`, `click` and `tag_screenshot` primitives. Adapt it in Scraper Studio to the exact public target selected for the final demo.

## Deployment

A zero-dependency `Dockerfile` is included. Any platform that can run a Node 22 container works; a public deployment is required if you want Bright Data to crawl the controlled fixture.

```bash
docker build -t webreceipt .
docker run --rm -p 3000:3000 --env-file .env webreceipt
```

## Collector output contract

The app expects the collector to provide concepts equivalent to:

```json
{
  "subject": "Ocean House · 1 night · Deluxe Room",
  "targetUrl": "https://public.example/...",
  "currency": "INR",
  "offer": {"advertisedPrice": 8499, "claims": ["Free cancellation"]},
  "checkout": {
    "basePrice": 8499,
    "feeItems": [{"label": "Property fee", "amount": 499}],
    "mandatoryFees": 848,
    "taxes": 800,
    "finalTotal": 10147,
    "discounts": 0
  },
  "terms": {
    "cancellation": "Free cancellation until 21 Aug",
    "refundability": "Refundable",
    "paymentTiming": "Pay now",
    "inclusions": ["Breakfast"]
  },
  "journey": [],
  "evidence": []
}
```

## Safety / eligibility boundary

WebReceipt is intentionally limited to publicly available, anonymous web data. It does **not** log into user accounts, perform purchases, collect personal information, bypass paywalls, or claim that a company violated a law. It records reproducible observed facts and lets a user inspect their evidence.

## Repository map

```text
public/                    judge-facing SPA
src/domain/                contract, hashing, validation, diff, anomalies
src/integrations/          Bright Data + deterministic simulator
src/services/              orchestration + file-backed history
src/fixtures/              healthy/adversarial observation fixtures
brightdata/                Scraper Studio Browser Worker + parser
docs/                      architecture, setup and demo runbook
examples/                  required example structured output
test/                     unit + end-to-end tests
```

## Two-minute demo sequence

1. **0:00–0:15** — “Receipts remember what you paid, not what the internet promised.”
2. **0:15–0:35** — Generate a receipt; show Journey Replay and Deal Contract.
3. **0:35–0:50** — Click final price; show URL/text/timestamp/hash provenance.
4. **0:50–1:05** — Press **Break website**. Legacy selector silently returns subtotal.
5. **1:05–1:30** — Integrity failure → self-heal → retest → 6/6 checks pass.
6. **1:30–1:50** — Promise Diff: price/fee/cancellation/inclusion changed on day +3.
7. **1:50–2:00** — “The web can change after you buy. Your receipt shouldn’t.”

## AI disclosure

AI coding assistance was used during implementation. The architecture, constraints, deterministic validation rules, tests and integration behavior are explicitly documented so the participant can verify and explain the submitted system.

## License

MIT.
