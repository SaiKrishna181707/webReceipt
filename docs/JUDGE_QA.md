# WebReceipt judge Q&A

This is the short technical explanation the participant should be able to give without reading code during judging.

## What problem does WebReceipt solve?

Transaction receipts remember what was paid, but mutable webpages do not preserve the offer that caused the purchase. WebReceipt captures a public anonymous offer/checkout journey as a canonical Deal Contract with evidence, then compares later observations.

## Why is Bright Data central rather than decorative?

The product depends on a custom Scraper Studio Browser Worker to navigate the public journey, click into checkout, capture screenshots, parse structured fields, and keep that collector working after the page changes. Remove Scraper Studio and the observation/self-healing pipeline is gone.

## What is technically new about the failure demo?

The old selector does not disappear. In V2, `.total-price` still returns a valid number, but its meaning changes from final total to subtotal. JSON and selectors therefore look healthy while the economics are wrong. WebReceipt detects the contradiction with a deterministic arithmetic contract.

## Why not just trust Scraper Studio self-healing?

A generated repair is still a code change. WebReceipt treats `preview_result` as untrusted, compiles it into the same Deal Contract, and runs all integrity checks before calling the approval endpoint. Invalid or malformed previews are rejected. A fresh collector run is verified again after approval/autosave.

## What exactly is real versus simulated?

- `brightdata/interaction.js` and `brightdata/parser.js` are the real custom Scraper Studio code intended for the published collector.
- `/fixture/hotel` is a real public browser/DOM failure lab once the app is deployed.
- V1→V2 changes actual DOM semantics while preserving the legacy selector.
- Chaos Checkout is deterministic local/adversarial testing. Its first four cases are post-extraction semantic fixtures, not claims that a browser was launched seven times.
- The synthetic day+3 Promise Diff exists only in simulator mode. Bright Data live mode compares actual stored observations.

## What do the hashes prove?

They are integrity checksums. WebReceipt recomputes them to detect inconsistent post-capture edits. They are not a digital signature, immutable ledger, independent timestamp, or legal notarization because a writer who can replace the whole artifact can also recompute hashes.

## Is this a legal dark-pattern detector?

No. WebReceipt reports reproducible observed facts: advertised price, final total, fees, terms, and changes. It does not declare that a company broke a law.

## What data is allowed?

Only public anonymous HTTP(S) pages. The app and Browser Worker reject obvious credential-bearing, local/private-network, account/login, private, and paywall targets. It does not log in, buy anything, or collect personal information.

## Why is the controlled fixture necessary?

A judging demo cannot depend on a third-party site redesigning itself at the right moment. The fixture gives a deterministic V1/V2 failure that the real custom collector can crawl after deployment. The same canonical schema can then be adapted to a real public lodging journey for credibility.

## What remains to be done outside this repository?

Create/publish the custom Browser Worker in the participant's Bright Data account, configure the real Collector ID/API token on the deployed app, and record at least one genuine Bright Data V1→V2→self-heal run. The repository does not falsely claim that cloud run occurred without those credentials.
