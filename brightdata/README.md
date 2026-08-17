# Bright Data custom scraper

WebReceipt is designed around a **custom Scraper Studio Browser Worker**, as required by Into the Scrape-Verse.

For the deterministic live demo, deploy WebReceipt publicly and point the collector at:

```text
https://YOUR_DEPLOYMENT/fixture/hotel
```

Then copy:

- `interaction.js` into Scraper Studio Interaction code
- `parser.js` into Scraper Studio Parser code

The initial parser intentionally extracts final total from `.total-price`. In fixture V1 that is correct. When WebReceipt flips the same public URL to V2, `.total-price` remains in the DOM but now means **subtotal**, while the true final total moves to `[data-testid="order-total"]`.

That is deliberate: it creates a realistic **wrong-but-valid** extraction. The application detects the semantic contradiction and calls Bright Data Self-Healing with a field-meaning prompt. The repaired collector is accepted only if the canonical Deal Contract passes all integrity rules.

For real third-party lodging targets, adapt the public journey and parser selectors to that site's anonymous pages while keeping the same canonical output concepts.

Never use private, login-protected, paywalled, personal, or restricted data.
