# Bright Data evidence manifest

## Verified collector

- Collector ID: `c_mt3ha1iv1jgm8eg813`
- Name: `webreceipt-proof-of-promise`
- Creation status: `done`
- Creation time: `2026-08-21T21:45:18.391Z`

## V1 healthy run

- Public target: `https://web-receipt-tawny.vercel.app/fixture/hotel`
- Target deployment code commit: `c0d5cec87c8fddfef76eea8adb2f92748a07435a`
- Bright Data response ID: `d2t1787348958838riur12r0gllg`
- Advertised/base price: INR 8,499
- Property fee: INR 499
- Service fee: INR 349
- Tax: INR 800
- Verified order total: INR 10,147
- Raw token-free evidence: `evidence/02-run-v1.json`

## V2 resilient run

- The same `/fixture/hotel` URL was switched from fixture V1 to fixture V2 in commit `97c736535fc548ef5e5872a429c37112f5ff49e8`.
- The same Collector ID still extracted the correct INR 10,147 total after the V2 semantic/layout drift.
- This is retained as resilience evidence rather than mislabeled as a failure.
- Raw token-free evidence: `evidence/03-run-after-change.json`.

## V3 interaction break

- The same public URL was changed again so the true total is only rendered after a new `Review final amount` interaction.
- The same Collector ID `c_mt3ha1iv1jgm8eg813` failed before healing with `parse_error` / `Parse error: value must be finite number`.
- Bright Data response ID: `d2t1787349538226r45el6nl3rrg`.
- Raw token-free failure evidence: `evidence/04-run-v3-before-heal.json`.

## Self-heal proposal and verification

- Bright Data self-healing completed its planner/code-fixer/preview/validator flow and stopped at the human approval gate with `status = awaiting_approval`.
- The proposed template reports one changed step and preserves the same Collector ID `c_mt3ha1iv1jgm8eg813`.
- Preview advertised/base price: INR 8,499.
- Preview property fee: INR 499.
- Preview service fee: INR 349.
- Preview tax: INR 800.
- Preview final order total: INR 10,147.
- Deal Contract arithmetic gate passes: `8499 + 499 + 349 + 800 = 10147`.
- Cancellation, refundability, payment timing, inclusions, offer name, and journey state remain present.
- The repaired journey reaches `Step 3 of 3 · Final amount reviewed`.
- Token-free normalized preview evidence: `evidence/05-heal-proposal.json`.
- Approval is intentionally performed only after this verification; the post-approval rerun must use the same Collector ID and same target URL.

## Security

No Bright Data API token, authorization header, cookie, or operator secret is stored in this evidence directory.
