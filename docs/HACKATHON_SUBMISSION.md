# Into the Scrape-Verse submission guide

This file maps WebReceipt to the hackathon judging requirements without claiming sponsor evidence that has not been captured yet.

## Recommended track

**Best Use of Bright Data / Web-Slinger**

WebReceipt is built around the part the sponsor track rewards: a custom Scraper Studio collector produces a stable structured contract, downstream logic detects semantic drift, and the same Collector ID can be repaired through Bright Data self-healing without changing the consumer-facing schema.

## One-line pitch

**WebReceipt is a proof-of-promise engine that turns mutable checkout pages into verifiable Deal Contracts and uses Bright Data Scraper Studio self-healing when a website silently changes what an extractor means.**

## Problem

A payment receipt proves what was charged, but it usually does not preserve the promises that caused the purchase: advertised price, mandatory fees, cancellation terms, refundability, payment timing, and the evidence behind those claims. Those pages can change after the fact, and ordinary scrapers can fail silently when a selector still returns a value with the wrong meaning.

## Solution

WebReceipt runs a public purchase journey, extracts the commercially important fields through a custom Bright Data Scraper Studio Browser Worker, compiles them into a canonical Deal Contract, and validates semantic invariants such as:

```text
finalTotal = basePrice + mandatoryFees + taxes + optionalAddons - discounts
```

If a redesign causes a wrong-but-valid extraction, WebReceipt detects the semantic failure. Its repair loop requests a Bright Data self-heal, treats the returned preview as untrusted, validates the preview against the same Deal Contract invariants, approves only a valid repair, and then re-runs the same production Collector ID before declaring recovery.

## Bright Data is central, not decorative

The real sponsor-backed path is:

```text
public target
→ Bright Data Scraper Studio Browser Worker (c_* Collector ID)
→ POST /dca/trigger
→ structured dataset
→ WebReceipt Deal Contract compiler
→ semantic integrity checks
→ receipt/evidence history
→ on failure: refactor_template self-heal
→ verify preview
→ approve/reject
→ re-run same Collector ID
```

The product UI remains intentionally deterministic for a reliable visual walkthrough. Real Bright Data calls run through the protected `/api/brightdata/*` server routes and the standalone sponsor harness/CLI flow. This separation keeps secrets and paid/mutating operations off the browser while still wiring the production Collector ID into the actual WebReceipt engine.

## Judge demo sequence

### Product story

1. Open `/console` and observe the controlled checkout journey.
2. Show the Deal Contract and evidence provenance for critical fields.
3. Trigger the simulated wrong-but-valid redesign to explain the failure mode visually.
4. Show the semantic integrity failure (`total_arithmetic`).
5. Show the verified repair gate and post-repair contract.
6. Open receipt history / Promise Diff to show the downstream value of stable structured data.

### Sponsor proof

Run the real sequence from `brightdata/CLI_RUNBOOK.md` using the production Collector ID:

1. `bdata scraper create` / publish the custom Browser Worker.
2. `bdata scraper run` against V1.
3. Break the public controlled fixture without changing its URL.
4. `bdata scraper run` again and preserve the failing structured output.
5. `bdata scraper heal` with the semantic repair prompt.
6. Capture the preview/diff and validate it through WebReceipt.
7. Approve/save only a valid proposal.
8. Re-run the **same** `c_*` Collector ID and show the recovered contract.

Also show:

```text
GET  /api/brightdata/health
POST /api/brightdata/observe
POST /api/brightdata/heal
```

to demonstrate that the deployed application can drive the same production collector server-side without changing the frontend.

## Evidence required before final submission

Do not mark these complete until genuine Bright Data output exists.

- [ ] Real custom Scraper Studio collector created/published.
- [ ] Real production `c_*` Collector ID recorded in `CLAUDE.md`.
- [ ] `BRIGHT_DATA_API_TOKEN` stored only in deployment secrets.
- [ ] V1 production run captured under `evidence/`.
- [ ] Broken-layout/failing production run captured separately.
- [ ] Self-heal proposal/preview captured.
- [ ] Approval/rejection outcome captured.
- [ ] Post-heal run captured with the same Collector ID.
- [ ] `evidence/MANIFEST.md` records timestamps and repository commit SHA.
- [ ] Demo video shows the problem, Bright Data workflow, structured output, self-healing, and final product.
- [ ] Repository setup steps reproduce the project without secret material.

## Judging rubric mapping

| Criterion | WebReceipt evidence |
| --- | --- |
| Potential impact | Preserves consumer-facing commercial promises and evidence, not only payment events. |
| Creativity / innovation | Detects semantic extraction drift where a selector still returns syntactically valid but economically wrong data. |
| Technical excellence | Canonical schema, integrity checks, evidence hashing/provenance, guarded live operations, retries, verification tests. |
| Use of Scraper Studio | Custom Browser Worker and production Collector ID are the source of the real observation pipeline. |
| Reliability / self-healing | Preview-before-approval gate plus fresh post-heal rerun of the same Collector ID. |
| Presentation | Deterministic product walkthrough paired with independently inspectable real sponsor evidence. |

## Submission truthfulness boundary

Until the evidence checklist above is complete, describe the repository as **Bright Data integrated and ready for a production collector**, not as having completed a genuine sponsor cloud run. Never substitute an example Collector ID or fabricated response for the missing proof.
