# Architecture notes

## Boundary

WebReceipt records reproducible observations from **public anonymous commercial pages**. It does not log in, purchase, collect personal data, or make legal determinations.

## Core invariant

A scraper run is not considered successful merely because fields are populated. The resulting Deal Contract must be internally consistent.

Current hard checks:

1. `base + mandatory fees + taxes + selected optional addons - discounts == final total`
2. Sum of required fee items equals `mandatoryFees`.
3. Monetary fields use one currency.
4. Final total is plausible after explicit discounts.
5. Critical fields have evidence provenance.
6. Journey has comparable start/end observations.

A critical violation enters the self-healing loop.

## Interfaces

The orchestrator depends on a collector with two methods:

```js
collect({ url, mutation? }) -> raw observation
heal({ prompt, customInput }) -> heal result
```

`SimulatorCollector` and `BrightDataCollector` implement the same interface, so deterministic tests exercise the exact orchestration path used in live mode.

## Why a controlled fixture exists

The deployed `/fixture/hotel` endpoint can switch from V1 to V2 without changing its URL.

- V1: `.total-price` means final total (`₹10,147`).
- V2: `.total-price` still exists but now means subtotal (`₹8,499`); the real final total moved to `[data-testid="order-total"]`.

This demonstrates the dangerous scraper failure: valid JSON containing the wrong fact. The checked-in initial Scraper Studio parser intentionally uses `.total-price`, allowing a real self-heal demo after the fixture changes.
