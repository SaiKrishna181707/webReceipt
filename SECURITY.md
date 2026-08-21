# Security and data-boundary policy

WebReceipt is a hackathon prototype for collecting **public, anonymous web data**. It is intentionally not designed to access accounts, paywalls, private pages, personal information, or authenticated checkout state.

## Production boundary

- Use only public HTTP(S) targets that can be opened without credentials.
- Do not add cookies, login sessions, account credentials, payment details, or personal data to Scraper Studio inputs.
- Keep `BRIGHT_DATA_API_TOKEN` server-side. Never place it in browser code, screenshots, logs, or committed files.
- On public deployments with Bright Data credentials, set `WEBRECEIPT_OPERATOR_TOKEN` for protected live observe/heal operations.
- Anonymous `/api/observe` is allowed to spend Bright Data credits only on the verified controlled proof target by default. Arbitrary public targets use the protected `/api/brightdata/observe` route unless `WEBRECEIPT_ALLOW_PUBLIC_LIVE_OBSERVE=true` is deliberately enabled.
- `WEBRECEIPT_ALLOW_UNPROTECTED_LIVE=true` is an explicit unsafe/demo opt-out for protected live APIs because anonymous visitors could otherwise consume Bright Data credits or mutate the live self-healing workflow.

## Request and target hardening

- Next.js JSON API bodies are capped at 256 KiB and malformed/non-object JSON is rejected instead of silently falling back to defaults.
- Target-policy checks reject non-HTTP(S), credential-bearing, localhost/private-network and obvious login/private routes before live collection.
- Bright Data calls have request deadlines, bounded polling, transient retries and fail-closed handling for empty/error datasets.
- Unexpected production errors are returned with a generic internal-error message instead of leaking arbitrary exception text.

## Evidence integrity

WebReceipt stores SHA-256 integrity fingerprints for evidence metadata and the canonical Deal Contract and recomputes them during validation. They detect inconsistent or accidental post-capture edits, but the hashes are stored with the record and can be recomputed by anyone who can rewrite the package. They are **integrity checksums, not a digital signature, notarization, immutable ledger, or independent timestamp authority**.

Generated Bright Data collectors may return structured fields without screenshot/DOM metadata. The server normalization layer records that provenance transparently and does not invent screenshot references or selectors.

## Self-healing safety

A proposed Scraper Studio repair is treated as untrusted. WebReceipt normalizes and compiles the repair `preview_result` into the same Deal Contract and runs the semantic integrity rules **before** approval. Invalid, malformed or missing previews are rejected. Approved repairs are then rerun with the same collector and verified again before `healed=true`.

A Bright Data collector failure such as `parse_error` can trigger this same guarded heal path only when auto-heal is explicitly enabled. Without auto-heal it fails clearly and does not manufacture a contract.

## Framework dependency audit

`npm audit --omit=dev` is reported in CI. At the 22 Aug 2026 pre-submission audit, npm reports high-severity advisories for the installed Next.js 14 line and its bundled PostCSS, with automated remediation requiring a breaking framework major upgrade.

The application was checked against the principal affected feature paths and does not currently use Server Actions (`use server`), `next/image`, dynamic rewrites/redirect hostnames, middleware/proxy, or CSP nonce/`beforeInteractive` patterns. Server-side Bright Data requests also do not use the `fetch(new Request(...), differentInit)` cache-confusion pattern. A forced Next major upgrade immediately before judging was therefore deferred; upgrading the framework is the first post-hackathon maintenance priority.

## Persistence boundary

On Vercel, the JSON store uses writable temporary storage so a successful observation does not fail because the deployed project filesystem is read-only. This storage is **ephemeral**, not durable across cold starts or function instances. Production-grade receipt history should use persistent database/KV storage.

## Reporting

For this hackathon repository, report security issues privately to the repository owner rather than including exploit details in a public issue.
