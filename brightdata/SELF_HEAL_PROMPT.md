# WebReceipt semantic self-heal prompt

Use this prompt when the V2 fixture makes the old selector return a subtotal as `checkout.finalTotal`:

```text
WebReceipt semantic integrity failure. Preserve the current output schema and collector identity. The checkout.finalTotal field is returning a subtotal instead of the final amount due. Re-extract checkout.finalTotal from the current public checkout page by semantic meaning: it must represent the final amount due today and satisfy basePrice + mandatoryFees + taxes + optionalAddons - discounts. Preserve checkout fee items, cancellation terms, journey evidence, and screenshot provenance. Do not add login, payment, or private-data steps.
```

The important property is that the prompt does **not** tell the healer which selector to use. The repaired extraction must rediscover the field based on its meaning on the redesigned page.
