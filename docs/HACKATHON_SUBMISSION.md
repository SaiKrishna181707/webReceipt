# Into the Scrape-Verse submission guide

This file maps WebReceipt to the hackathon judging requirements and distinguishes verified sponsor evidence from deployment configuration that still needs to be checked separately.

## Recommended track

**Best Use of Bright Data / Web-Slinger**

WebReceipt is built around the part the sponsor track rewards: a custom Scraper Studio collector produces a stable structured contract, downstream logic detects semantic drift, and the same Collector ID is repaired through Bright Data self-healing without changing the consumer-facing schema.

## One-line pitch

**WebReceipt is a proof-of-promise engine that turns mutable checkout pages into verifiable Deal Contracts and uses Bright Data Scraper Studio self-healing when a website silently changes what an extractor means.**

## Problem

A payment receipt proves what was charged, but it usually does not preserve the promises that caused the purchase: advertised price, mandatory fees, cancellation terms, refundability, payment timing, and the evidence behind those claims. Those pages can change after the fact, and ordinary scrapers can fail silently when a selector still returns a value with the wrong meaning.

## Solution

WebReceipt runs a public purchase journey, extracts the commercially important fields through a custom Bright Data Scraper Studio Browser Worker, compiles them into a canonical Deal Contract, and validates semantic invariants such as:

```text
finalTotal = basePrice + mandatoryFees + taxes + optionalAddons - discounts
```

If a redesign causes a wrong or incomplete extraction, WebReceipt detects the semantic failure. Its repair loop requests a Bright Data self-heal, treats the returned preview as untrusted, validates the preview against the same Deal Contract invariants, approves only a valid repair, and then re-runs the same production Collector ID before declaring recovery.

## Bright Data is central, not decorative

The verified sponsor-backed path is:

```text
public target
→ Bright Data Scraper Studio Browser Worker
→ c_mt3ha1iv1jgm8eg813
→ structured dataset
→ controlled semantic / interaction drift
→ failing extraction
→ Bright Data refactor_template self-heal
→ preview_result
→ WebReceipt arithmetic + field-preservation gate
→ human approval + auto-save
→ re-run same Collector ID
→ recovered structured contract
```

The product UI remains intentionally deterministic for a reliable visual walkthrough. Real Bright Data calls run through the sponsor CLI flow and are also wired into protected server routes for deployments that have the required credentials configured. This separation keeps secrets and paid/mutating operations off the browser while preserving a real production collector path.

## Verified sponsor proof

Collector:

```text
ID: c_mt3ha1iv1jgm8eg813
Name: webreceipt-proof-of-promise
Target: https://web-receipt-tawny.vercel.app/fixture/hotel
```

Observed lifecycle:

1. V1 healthy run extracted advertised/base INR 8,499, INR 499 property fee, INR 349 service fee, INR 800 tax, and INR 10,147 final order total.
2. V2 changed layout/semantics at the exact same URL; the same collector stayed correct, demonstrating resilience.
3. V3 introduced a new `Review final amount` interaction before the true total is rendered.
4. The same collector then failed with `parse_error: value must be finite number`.
5. `brightdata scraper heal` generated a proposed repair and stopped at `awaiting_approval`.
6. Preview output restored INR 10,147 and preserved cancellation, refundability, payment timing, inclusions, offer name, and journey state.
7. WebReceipt's gate verified `8499 + 499 + 349 + 800 = 10147` before approval.
8. The proposal was approved with `scraper approve --auto-save`.
9. The exact same collector was rerun against the exact same V3 URL and recovered the correct INR 10,147 contract with `Step 3 of 3 · Final amount reviewed`.

Evidence is committed under `evidence/01-create.json` through `evidence/07-run-after-heal.json`, with lifecycle metadata in `evidence/MANIFEST.md`.

## Judge demo sequence

### Product story

1. Open `/console` and observe the controlled checkout journey.
2. Show the Deal Contract and evidence provenance for critical fields.
3. Trigger the simulated wrong-but-valid redesign to explain the failure mode visually.
4. Show the semantic integrity failure (`total_arithmetic`).
5. Show the verified repair gate and post-repair contract.
6. Open receipt history / Promise Diff to show the downstream value of stable structured data.

### Sponsor proof

Show the committed evidence and, if reproducing live, run the same sequence from `brightdata/CLI_RUNBOOK.md` using production Collector ID `c_mt3ha1iv1jgm8eg813`:

1. show the real collector creation evidence;
2. show the healthy V1 output;
3. show V2 resilience;
4. show the V3 `parse_error` failure;
5. show the self-heal prompt and `awaiting_approval` state;
6. show the preview passing the WebReceipt arithmetic gate;
7. show human approval / auto-save;
8. show the recovered V3 output from the **same** collector ID.

If the production deployment has Bright Data credentials configured, also show:

```text
GET  /api/brightdata/health
POST /api/brightdata/observe
POST /api/brightdata/heal
```

Do not present these deployed routes as configured unless the live health response confirms it.

## Evidence checklist

- [x] Real custom Scraper Studio collector created.
- [x] Real production `c_*` Collector ID recorded in repository docs.
- [x] V1 production run captured under `evidence/`.
- [x] Post-change V2 resilience run captured separately.
- [x] Genuine V3 failing production run captured separately.
- [x] Self-heal proposal/preview captured.
- [x] Preview verified against Deal Contract arithmetic and field-preservation rules.
- [x] Approval outcome captured.
- [x] Post-heal run captured with the same Collector ID and same URL.
- [x] `evidence/MANIFEST.md` records collector identity, response IDs, target commits, and lifecycle facts.
- [x] Repository evidence contains no Bright Data API token or operator secret.
- [ ] Verify the actual Vercel production project has the Bright Data token/collector environment variables if the live server-side route is part of the demo.
- [ ] Demo video shows the problem, Bright Data workflow, structured output, self-healing, human approval, recovery, and final product.

## Judging rubric mapping

| Criterion | WebReceipt evidence |
| --- | --- |
| Potential impact | Preserves consumer-facing commercial promises and evidence, not only payment events. |
| Creativity / innovation | Demonstrates both resilience to one redesign and a real failure on a later journey change, then repairs the same collector. |
| Technical excellence | Canonical schema, integrity checks, evidence provenance, guarded live operations, retries, controlled fixture versions, and verification tests. |
| Use of Scraper Studio | A real custom Browser Worker with production Collector ID `c_mt3ha1iv1jgm8eg813` produced all sponsor evidence. |
| Reliability / self-healing | Genuine V3 failure → Bright Data heal → preview-before-approval integrity gate → human approval → fresh same-ID rerun. |
| Presentation | Deterministic product walkthrough paired with independently inspectable real sponsor evidence. |

## Submission truthfulness boundary

The Bright Data **CLI sponsor lifecycle is genuinely complete and evidenced**: collector creation, healthy run, drift, real failure, self-heal proposal, human approval, and same-collector recovery have all occurred.

A separate claim remains conditional: do not say the deployed `/api/brightdata/*` production routes are credential-configured until the live deployment's health endpoint confirms the required environment variables are present. The repository must continue to keep API tokens and operator secrets out of git.
