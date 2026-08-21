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

## Controlled semantic drift

- The same `/fixture/hotel` URL was switched from fixture V1 to fixture V2 in commit `97c736535fc548ef5e5872a429c37112f5ff49e8`.
- The same Collector ID must be used for the failing/post-change run and the subsequent heal.

## Security

No Bright Data API token, authorization header, cookie, or operator secret is stored in this evidence directory.
