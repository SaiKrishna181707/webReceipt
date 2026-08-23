# Bright Data evidence manifest

## Verified collector

- Collector ID: `c_mt3ha1iv1jgm8eg813`
- Name: `webreceipt-proof-of-promise`
- Creation status: `done`
- Creation time: `2026-08-21T21:45:18.391Z`
- Public target: `https://web-receipt-tawny.vercel.app/fixture/hotel`

## Provenance of each artifact

See `evidence/README.md` for what the tiers mean and how to upgrade one.

| Artifact | Tier | Note |
| --- | --- | --- |
| `01-create.json` | operator-supplied | collector creation record |
| `02-run-v1.json` | operator-supplied | `source` field records CLI run output supplied by the participant |
| `03-run-after-change.json` | operator-supplied | V2 resilience run |
| `04-run-v3-before-heal.json` | operator-supplied | real `parse_error`, captured from the CLI |
| `05-heal-proposal.json` | operator-normalized | raw CLI output retained on the operator machine |
| `06-heal-approved.json` | operator-normalized | transcribed from terminal output |
| `07-run-after-heal.json` | operator-normalized | raw CLI output retained on the operator machine |

**Open task:** no artifact here is yet a byte-for-byte redacted copy of the CLI's
own output file. The lifecycle is real, but its committed form passed through the
operator's hands. Replacing these with redacted raw captures is the single
highest-value remaining action on this directory, because WebReceipt's own thesis
is that a record should not be trusted merely because it looks consistent.

## Independently checkable details

A reader does not have to take the above on trust. These hold without any
Bright Data account:

- The four `response_id` values embed millisecond timestamps that decode to a
  monotonic sequence inside a single 21-minute window on 2026-08-21
  (21:49:18.838 → 21:58:58.226 → 22:09:59.152 → 22:10:30.792), consistent with
  the collector creation time of 21:45:18.391 recorded below.
- `@brightdata/cli@0.3.2`, named in `06-heal-approved.json`, is a real published
  version, and the package installs both `brightdata` and `bdata` as aliases for
  the same entrypoint — which is why both names appear across these files.

Neither check proves the run happened. Both are things a reconstruction would
have had to get right by accident.

## CLI naming

`brightdata` and `bdata` are the same executable. Their appearance in different
artifacts is not a discrepancy, and these files are deliberately **not**
normalized to a single name — captured output is left as captured.

## V1 healthy run

- Target deployment code commit: `c0d5cec87c8fddfef76eea8adb2f92748a07435a`.
- Bright Data response ID: `d2t1787348958838riur12r0gllg`.
- Advertised/base price: INR 8,499.
- Property fee: INR 499.
- Service fee: INR 349.
- Tax: INR 800.
- Verified order total: INR 10,147.
- Raw token-free evidence: `evidence/02-run-v1.json`.

## V2 resilient run

- The same `/fixture/hotel` URL was switched from fixture V1 to fixture V2 in commit `97c736535fc548ef5e5872a429c37112f5ff49e8`.
- The same Collector ID still extracted the correct INR 10,147 total after the V2 semantic/layout drift.
- This is retained as resilience evidence rather than mislabeled as a failure.
- Raw token-free evidence: `evidence/03-run-after-change.json`.

## V3 interaction break

- The same public URL was changed again so the true total is only rendered after a new `Review final amount` interaction.
- V3 target code was completed in commit `f4bda8f44cf0ce461c8cd61c96ff53890819d344` and that deployment reached Vercel success.
- The same Collector ID `c_mt3ha1iv1jgm8eg813` failed before healing with `parse_error` / `Parse error: value must be finite number`.
- Bright Data response ID: `d2t1787349538226r45el6nl3rrg`.
- Raw token-free failure evidence: `evidence/04-run-v3-before-heal.json`.

## Self-heal proposal and integrity gate

- Bright Data self-healing completed its planner/code-fixer/preview/validator flow and stopped at the human approval gate with `status = awaiting_approval`.
- The proposed template reported one changed step and preserved Collector ID `c_mt3ha1iv1jgm8eg813`.
- Preview advertised/base price: INR 8,499.
- Preview property fee: INR 499.
- Preview service fee: INR 349.
- Preview tax: INR 800.
- Preview final order total: INR 10,147.
- Deal Contract arithmetic gate passed: `8499 + 499 + 349 + 800 = 10147`.
- Cancellation, refundability, payment timing, inclusions, offer name, and journey state remained present.
- The repaired journey reached `Step 3 of 3 · Final amount reviewed`.
- Token-free normalized preview evidence: `evidence/05-heal-proposal.json`.

## Human approval and saved repair

- The verified preview was approved with `@brightdata/cli@0.3.2` using `scraper approve ... --auto-save`.
- The CLI returned to the prompt without an error and wrote the local approval artifact `06-heal-approved.json`.
- The approval was performed only after the preview passed the arithmetic/field-preservation gate.
- Token-free normalized approval record: `evidence/06-heal-approved.json`.

## Post-heal recovery

- The exact same Collector ID `c_mt3ha1iv1jgm8eg813` was rerun against the exact same V3 URL after approval.
- Observed successful Bright Data response ID: `d2t1787350199152rppj3b6gbpf`.
- A second capture run was written locally with response ID `d2t1787350230792rojdm3dofc5g`.
- Advertised/base price: INR 8,499.
- Property fee: INR 499.
- Service fee: INR 349.
- Tax: INR 800.
- Recovered final order total: INR 10,147.
- Recovered journey state: `Step 3 of 3 · Final amount reviewed`.
- Token-free normalized post-heal evidence: `evidence/07-run-after-heal.json`.

## Verified lifecycle

```text
V1 healthy
→ V2 semantic/layout drift survives
→ V3 new interaction causes parse failure
→ Bright Data self-heal proposes repair
→ WebReceipt arithmetic/field gate validates preview
→ human approves and auto-saves
→ same Collector ID reruns same URL
→ INR 10,147 contract is recovered
```

## Security

No Bright Data API token, authorization header, cookie, or operator secret is stored in this evidence directory.
