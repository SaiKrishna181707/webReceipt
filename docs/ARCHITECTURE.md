# Architecture notes

## Boundary

WebReceipt records reproducible observations from **public anonymous commercial pages**. It does not log in, purchase, collect personal data, bypass paywalls, or make legal determinations.

## Core invariant

A scraper run is not successful just because fields are populated. The resulting Deal Contract must be semantically coherent and its evidence must still match its hashes.

Healthy contracts currently pass 11 checks:

1. checkout arithmetic;
2. mandatory-fee breakdown arithmetic;
3. discount bounds;
4. currency consistency;
5. final-price journey plausibility;
6. critical evidence completeness;
7. evidence SHA-256 recomputation;
8. whole-contract SHA-256 recomputation;
9. journey evidence references resolve;
10. evidence source URLs are HTTP(S);
11. journey has comparable start/end observations.

Critical violations enter the repair proposal flow.

## Repair safety invariant

A self-heal proposal is **not trusted because Bright Data generated it**.

```text
invalid production observation
        ↓
heal(prompt)  // always stops at the approval gate
        ↓
pending_answer + preview_result
        ↓
compile preview into Deal Contract
        ↓
evaluateIntegrity(preview)
   ┌────┴────┐
 invalid    valid
   │          │
rejectHeal  approveHeal(autoSave:true)
              │
              ▼
       fresh collect(url)
              │
              ▼
       evaluateIntegrity again
```

If preview compilation itself fails, WebReceipt rejects the proposal. If approval succeeds but the fresh run is invalid, recovery is not declared successful.

## Collector interface

Both simulator and Bright Data adapters implement the same repair-gated interface:

```js
collect({ url, mutation? })
heal({ prompt }) // never auto-approves
approveHeal({ autoSave:true, mutation? })
rejectHeal({ mutation? })
```

The simulator deliberately models the approval gate instead of magically switching to healthy data. This lets orchestration tests prove approve/reject behavior without Bright Data credentials.

## Live vs simulator honesty

Simulator mode only serves the controlled WebReceipt fixture/demo target. It refuses arbitrary third-party URLs so the UI cannot imply that synthetic data came from a real site.

Bright Data live mode uses the published custom collector. Synthetic day+3 Promise Diff is simulator-only; live Promise Diff compares two stored real observations.

## Why the controlled fixture exists

The deployed `/fixture/hotel` can switch V1 → V2 without changing URL.

- V1: `.total-price` means final total (`₹10,147`).
- V2: `.total-price` still exists but now means subtotal (`₹8,499`).
- V2 also restructures the true `[data-testid="order-total"]` value across nested nodes.

That creates silent semantic corruption rather than a trivial missing selector.

## Public deployment controls

Bright Data credentials stay server-side. When credentials are configured, live/mutating operations are locked behind `WEBRECEIPT_OPERATOR_TOKEN` unless the deployer explicitly opts into unprotected live mode. A single-flight lock also prevents overlapping live operations from racing the same collector repair state.

The HTTP layer adds request-size limits, CSP/security headers, safe attachment names, strict mode validation, and path-safe static-file serving. Persistent state is written atomically and a corrupt JSON state file is backed up and replaced rather than crashing startup. Stored receipts are semantically/hash-revalidated on restart instead of trusting their previous stored verdict; structurally unusable receipt records are dropped.
