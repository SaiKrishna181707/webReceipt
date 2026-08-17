# Bright Data live setup

## 1. Deploy WebReceipt publicly

The controlled checkout lives at:

```text
https://YOUR_DEPLOYMENT/fixture/hotel
```

Bright Data must be able to reach this URL, so localhost only works in simulator mode.

## 2. Create a custom Scraper Studio Browser Worker

Create a custom scraper and copy the checked-in code:

- interaction: `brightdata/interaction.js`
- parser: `brightdata/parser.js`

Set the input schema to include:

```json
{"url":"string"}
```

Preview against the public fixture URL. V1 should produce `finalTotal: 10147`.

Save to Production and copy the Collector ID (`c_...`).

## 3. Configure WebReceipt

```bash
cp .env.example .env
```

Set:

```text
BRIGHT_DATA_API_TOKEN=...
BRIGHT_DATA_COLLECTOR_ID=c_...
```

Run `npm start` and select **Bright Data live**.

## 4. Live failure demo

1. Click **Generate receipt**. The app resets the controlled fixture to V1 first.
2. Confirm 6/6 integrity checks.
3. Click **Break website**. The app switches the fixture to V2 while keeping the same URL.
4. The old parser extracts `.total-price = ₹8,499` as the final total.
5. WebReceipt detects the arithmetic contradiction.
6. WebReceipt calls the Scraper Studio Self-Healing API with a semantic repair prompt.
7. Once Bright Data finishes the refactor, WebReceipt reruns the same collector and accepts the result only after all contract checks pass.

The AI Flow is asynchronous; live repair time depends on Bright Data. For a demo video, record the genuine operation and compress waiting time rather than faking the response.

## Important

Scraper Studio AI may produce a slightly different repaired selector/code than expected. The product does not trust that patch by default—the contract checks are the acceptance gate.
