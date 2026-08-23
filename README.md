# WebReceipt

**Proof of promise, sealed in code.**

WebReceipt is a web-data integrity system for public commerce pages. A user supplies a public URL, WebReceipt extracts the commercial facts the page actually exposes, structures those facts, verifies their semantics and provenance, and records the result. Missing checkout fields are never fabricated.

**Live app:** https://web-receipt-tawny.vercel.app  
**Console:** https://web-receipt-tawny.vercel.app/console

## The two product flows

WebReceipt deliberately separates real public-web observation from the reproducible semantic-drift demonstration.

### 1. Live Observation — real public URLs

The Console starts with an empty URL field. A user can paste a suitable public product or commerce URL, including a Nike, Amazon, or other retailer page.

```text
PUBLIC URL
  ↓
SCRAPE PUBLIC DATA
  ↓
EXTRACT COMMERCIAL FACTS
  ↓
STRUCTURE THE OBSERVATION
  ↓
VERIFY SEMANTICS + PROVENANCE
  ↓
RECORD THE RESULT
```

A product page may expose only a product price. In that case WebReceipt returns an **offer-only product observation** and clearly marks checkout as unavailable. It does not copy the product price into a fake final total just to produce a complete-looking receipt.

If a page genuinely exposes enough checkout evidence, WebReceipt compiles a canonical Deal Contract and seals the verified observation.

A real retailer URL is therefore evidence that **WebReceipt can observe real public web data**. It is not the semantic-drift fixture and WebReceipt never claims that a third-party retailer changed its website for the demo.

### 2. Semantic Drift Lab — owned controlled fixture

The controlled fixture lives at `/fixture/product` and is owned by WebReceipt. It is intentionally retailer-neutral: **Example Store · Wireless Studio Headphones**.

Its purpose is to reproduce a dangerous scraper failure deterministically while keeping the scraper itself unchanged.

Fixture V1:

```text
Product price              ₹12,999
Shipping                      ₹500
Other mandatory fees            ₹0
Taxes                           ₹0
-----------------------------------
Final total                  ₹13,499
```

The checked-in scraper reads the final total from `.total-price`. V1 is valid:

```text
12,999 + 500 + 0 + 0 = 13,499
```

Fixture V2 deliberately changes the controlled page's DOM semantics while the old scraper stays unchanged:

```text
.total-price                  → Product price ₹12,999
[data-testid="order-total"]   → Final total   ₹13,499
```

The same scraper still succeeds and returns a valid INR number, but it assigns the wrong meaning:

```text
productPrice = 12,999
shipping     =    500
finalTotal   = 12,999
```

The Contract Integrity Engine rejects the contradiction:

```text
12,999 + 500 + 0 + 0 != 12,999
```

That is WebReceipt's core semantic-drift proof: **the selector still works, but its business meaning changed**.

## Repair gate

A detected drift does not automatically authorize a scraper change.

```text
integrity failure
  ↓
repair proposal
  ↓
untrusted preview result
  ↓
compile preview into Deal Contract
  ↓
run integrity checks
  ↓
approve only if valid
  ↓
fresh scrape
  ↓
compile again
  ↓
verify again
  ↓
mark recovered only if the fresh result is valid
```

The existing heal gate remains strict. A repair is not considered successful merely because a proposal or preview exists.

## Console behavior

The Console now exposes two clearly separated capabilities:

**Live Observation**
- empty URL on first load
- user supplies the public URL
- real, read-only public observation
- five visible pipeline stages: scrape, extract, structure, verify, record
- unavailable fields stay unavailable

**Semantic Drift Lab**
- WebReceipt-owned controlled fixture
- Step 1: observe valid V1
- Step 2: deliberately redesign the fixture while using the same scraper
- Step 3: verify the repair preview, approve only after integrity passes, then perform a fresh scrape
- Step 4: Promise Diff the stored broken → recovered contract transition

The lab never mutates Nike, Amazon, or another real third-party website.

## Canonical Deal Contract

When enough evidence is available, WebReceipt normalizes different websites into one economic contract:

```json
{
  "offer": {
    "advertisedPrice": 12999,
    "currency": "INR"
  },
  "checkout": {
    "basePrice": 12999,
    "mandatoryFees": 500,
    "taxes": 0,
    "optionalAddons": 0,
    "discounts": 0,
    "finalTotal": 13499
  },
  "evidence": [
    {
      "field": "checkout.finalTotal",
      "capturedText": "₹13,499",
      "domPath": ".total-price"
    }
  ]
}
```

Critical evidence fields are hashed with SHA-256 and the compiled contract is sealed so later mutation is detectable.

## Bright Data integration

WebReceipt preserves the hackathon's real Bright Data Scraper Studio implementation:

- `brightdata/interaction.js`
- `brightdata/parser.js`
- protected Bright Data API bridge
- preview verification and approval gate
- preserved sponsor evidence

The historical Bright Data hotel lifecycle remains unchanged as sponsor-proof history. It is **not** rewritten to pretend those cloud runs were product or Nike runs.

### Verified historical Collector ID

**`c_mt3ha1iv1jgm8eg813`**

The ID is preserved in the original collector-creation artifact and the successful post-heal evidence.

Historical sequence:

```text
hotel V1 healthy run
→ same real Bright Data Collector ID
→ controlled site change
→ genuine extraction failure
→ Bright Data self-heal proposal
→ preview_result
→ WebReceipt integrity gate
→ approval / auto-save
→ same Collector ID rerun
→ recovered Deal Contract
```

Preserved evidence:

| Step | Evidence |
| --- | --- |
| Collector creation / real ID | `evidence/01-create.json` |
| Healthy production run | `evidence/02-run-v1.json` |
| Resilient run after change | `evidence/03-run-after-change.json` |
| Failing run | `evidence/04-run-v3-before-heal.json` |
| Heal proposal / preview | `evidence/05-heal-proposal.json` |
| Approved repair | `evidence/06-heal-approved.json` |
| Same-ID post-heal run | `evidence/07-run-after-heal.json` |
| Lifecycle metadata | `evidence/MANIFEST.md` |

The sponsor reproduction flow is documented in `brightdata/CLI_RUNBOOK.md`.

### Cloud completion rule

A checked-in parser change is not enough to claim a Bright Data production update. Scraper Studio must be saved/published with the final parser, and the exact same real Collector ID **`c_mt3ha1iv1jgm8eg813`** must then be rerun successfully. A replacement collector ID does not satisfy that gate.

## Local verification

Node.js 20 and 22 are the tested runtimes.

```bash
npm ci
npm run verify
npm test
npm run typecheck
npm run lint
npm run build
npm run smoke:next
```

The semantic-drift regression tests preserve the essential invariant:

```text
CONTROLLED WEBSITE STRUCTURE CHANGES
  ↓
SAME SCRAPER
  ↓
VALID-LOOKING BUT SEMANTICALLY WRONG DATA
  ↓
INTEGRITY ENGINE DETECTS THE DRIFT
  ↓
VERIFIED REPAIR
  ↓
FRESH SCRAPE
  ↓
VALID CONTRACT
```

## Positioning

WebReceipt verifies that scraped web data still means what you think it means.

A real retailer URL is simply an example of public web data that WebReceipt can observe. The reproducible semantic-drift failure uses a controlled website fixture that WebReceipt deliberately redesigns because a real third-party website cannot be modified for the demo.
