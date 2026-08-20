# WebReceipt judge Q&A

This is the short technical explanation the participant should be able to give without reading code during judging.

## What problem does WebReceipt solve?

Transaction receipts remember what was paid, but mutable webpages do not preserve the offer that caused the purchase. WebReceipt captures a public anonymous offer/checkout journey as a canonical Deal Contract with evidence, then compares later observations.

## Why is Bright Data central rather than decorative?

The sponsor-backed path uses a custom Scraper Studio Browser Worker to navigate the public journey, click into checkout, capture screenshots, parse structured fields, and keep that collector working after the page changes. The repository also contains a real Bright Data adapter and verified approval gate in `src/`; the sponsor harness is launched with `npm run start:brightdata` or the Dockerfile.

The current Next.js product UI is intentionally treated as a deterministic simulator demonstration unless a later authorized change wires that UI to the Bright Data adapter.

## What is technically new about the failure demo?

The old selector does not disappear. In V2, `.total-price` still returns a valid number, but its meaning changes from final total to subtotal. JSON and selectors therefore look healthy while the economics are wrong. WebReceipt detects the contradiction with a deterministic arithmetic contract.

## Why not just trust Scraper Studio self-healing?

A generated repair is still a code change. WebReceipt treats `preview_result` as untrusted, compiles it into the same Deal Contract, and runs all integrity checks before calling the approval endpoint. Invalid or malformed previews are rejected. A fresh collector run is verified again after approval/autosave.

## What exactly is real versus simulated?

- `brightdata/interaction.js` and `brightdata/parser.js` are the real custom Scraper Studio code intended for the published collector.
- `src/integrations/brightdata.js` and `src/server.js` implement the real Bright Data API path used by the sponsor harness.
- The sponsor harness exposes `/fixture/hotel` plus controlled break/reset endpoints for a deterministic public V1→V2 proof.
- The Next.js `/console` and `/mutation-lab` currently use `SimulatorCollector`; their heal flow demonstrates the same contract gate without making a cloud-run claim.
- Chaos Checkout contains seven mutations: four are absorbed without semantic drift, while three intentionally create semantic/evidence failures that must be detected and healed.
- The synthetic Promise Diff in the Next UI is a simulator demonstration. Real comparisons require stored real observations from the sponsor-backed path.

## What do the hashes prove?

They are integrity checksums. WebReceipt recomputes them to detect inconsistent post-capture edits. They are not a digital signature, immutable ledger, independent timestamp, or legal notarization because a writer who can replace the whole artifact can also recompute hashes.

## Is this a legal dark-pattern detector?

No. WebReceipt reports reproducible observed facts: advertised price, final total, fees, terms, and changes. It does not declare that a company broke a law.

## What data is allowed?

Only public anonymous HTTP(S) pages. The app and Browser Worker reject obvious credential-bearing, local/private-network, account/login, private, and paywall targets. It does not log in, buy anything, or collect personal information.

## Why is the controlled fixture necessary?

A judging demo cannot depend on a third-party site redesigning itself at the right moment. The fixture gives a deterministic V1/V2 failure that the real custom collector can crawl after the sponsor harness is deployed publicly. A separate real long-tail public target should be added for credibility if time permits.

## What remains to be done outside this repository?

Create/publish the custom Browser Worker in the participant's Bright Data account, record the real Collector ID, run and capture at least one genuine Bright Data V1→failure→self-heal→post-heal sequence, and record the final demo video. The repository must not claim those external steps occurred until the evidence exists.
