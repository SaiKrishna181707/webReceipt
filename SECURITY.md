# Security and data-boundary policy

WebReceipt is a hackathon prototype for collecting **public, anonymous web data**. It is intentionally not designed to access accounts, paywalls, private pages, personal information, or authenticated checkout state.

## Production boundary

- Use only public HTTP(S) targets that can be opened without credentials.
- Do not add cookies, login sessions, account credentials, payment details, or personal data to Scraper Studio inputs.
- Keep `BRIGHT_DATA_API_TOKEN` server-side. Never place it in browser code, screenshots, logs, or committed files.
- On public deployments with Bright Data credentials, set `WEBRECEIPT_OPERATOR_TOKEN`. Live collection, fixture mutation, and reset actions are locked by default when no operator token is configured.
- `WEBRECEIPT_ALLOW_UNPROTECTED_LIVE=true` is an explicit unsafe/demo opt-out because anonymous visitors could otherwise consume Bright Data credits or mutate the live self-healing workflow.

## Evidence integrity

WebReceipt stores SHA-256 integrity fingerprints for evidence metadata and the canonical Deal Contract and recomputes them during validation. They detect inconsistent or accidental post-capture edits, but the hashes are stored with the record and can be recomputed by anyone who can rewrite the package. They are **integrity checksums, not a digital signature, notarization, immutable ledger, or independent timestamp authority**.

## Self-healing safety

A proposed Scraper Studio repair is treated as untrusted. WebReceipt compiles the repair `preview_result` into the same Deal Contract and runs the semantic integrity rules **before** approval. Invalid or malformed previews are rejected. Approved repairs are then rerun and verified again.

## Reporting

For this hackathon repository, report security issues privately to the repository owner rather than including exploit details in a public issue.
