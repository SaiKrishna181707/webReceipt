export function renderProductFixture(version = 'v1') {
  const isV2 = version === 'v2';
  if (!['v1', 'v2'].includes(version)) throw new Error(`Unsupported product fixture version: ${version}`);

  // The fixture has two internal render states for deterministic testing. The
  // public page intentionally presents one product journey; the state change is
  // an internal website redesign used by the semantic-drift simulation.
  const totalMarkup = isV2
    ? `<div class="legacy redesigned-product-price"><span>Product price</span><strong class="total-price">₹12,999</strong></div>
       <div class="actual-total redesigned-total" data-testid="order-total"><span>Final total</span><strong><span class="currency-symbol">₹</span><span class="major">13,499</span></strong></div>`
    : `<div class="actual-total"><span>Final total</span><strong class="total-price" data-testid="order-total">₹13,499</strong></div>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nike Pegasus Demo — WebReceipt Controlled Fixture</title>
<style>
  body{margin:0;background:#f4f4f2;color:#171717;font-family:system-ui,sans-serif}.wrap{max-width:980px;margin:56px auto;padding:0 24px}.tag{font-size:12px;text-transform:uppercase;letter-spacing:.13em;color:#666}.grid{display:grid;grid-template-columns:1.08fr .92fr;gap:28px}.hero,.box{background:#fff;border:1px solid #deded8;border-radius:18px;padding:28px}.hero h1{font-size:40px;line-height:1.05;margin:8px 0}.price{font-size:34px;font-weight:900}.claim{display:inline-block;background:#eef7e8;padding:8px 10px;border-radius:9px;margin:7px 5px 0 0}.row,.actual-total,.legacy{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-bottom:1px solid #ecece7}.actual-total{font-size:22px;border:0;padding-top:22px}.legacy{color:#5f675f}.terms{margin-top:22px}.cta{margin-top:22px;border:0;border-radius:12px;background:#171717;color:#fff;padding:13px 18px;font-weight:800;cursor:pointer}.step{margin-top:14px;font-size:13px;color:#697069}.box[hidden]{display:none}.notice{font-size:13px;color:#5f695f;margin-top:12px}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:18px 0 4px;font-size:13px}.meta span{border:1px solid #ecece7;border-radius:9px;padding:9px}
  @media(max-width:760px){.grid{grid-template-columns:1fr}.wrap{margin:30px auto}.hero h1{font-size:34px}}
</style></head>
<body>
  <div class="wrap"><div class="grid">
    <section class="hero" data-testid="offer-panel" data-fixture-kind="product">
      <div class="tag">WebReceipt-controlled public product fixture</div>
      <h1 data-testid="offer-name">Nike Pegasus 41 · Men's Road-Running Shoes</h1>
      <div class="price" data-testid="advertised-price">₹12,999</div>
      <div class="meta">
        <span>Brand: <strong data-testid="product-brand">Nike</strong></span>
        <span>Model: <strong data-testid="product-model">Pegasus 41</strong></span>
        <span>SKU: <strong data-testid="product-sku">WR-PEGASUS-41</strong></span>
        <span>Seller: <strong data-testid="seller-name">WebReceipt Demo Store</strong></span>
      </div>
      <span class="claim">In stock</span><span class="claim">30-day returns</span>
      <p data-testid="delivery-estimate">Estimated delivery: 2–4 business days</p>
      <button class="cta" type="button" data-testid="continue-to-checkout">Review order</button>
      <div class="step" data-testid="journey-state">Step 1 of 2 · Product</div>
      <div class="notice">Controlled WebReceipt demo data only. No account, personal data, payment, or purchase is required.</div>
    </section>

    <section class="box" data-testid="checkout-panel" hidden>
      <div class="tag">Order summary</div>
      <div class="row"><span>Product price</span><strong data-testid="base-price">₹12,999</strong></div>
      <div class="row"><span>Shipping</span><strong data-testid="shipping-fee">₹500</strong></div>
      <div class="row"><span>Other mandatory fees</span><strong data-testid="other-fee">₹0</strong></div>
      <div class="row"><span>Taxes</span><strong data-testid="tax">₹0</strong></div>
      ${totalMarkup}
      <div class="terms">
        <p id="cancellation"><strong>Cancellation:</strong> Allowed before dispatch</p>
        <p id="refundability"><strong>Refundability:</strong> 30-day returns</p>
        <p id="payment-timing"><strong>Payment:</strong> No payment required in demo</p>
        <p id="inclusions"><strong>Includes:</strong> Nike Pegasus 41 shoes</p>
        <p data-testid="warranty"><strong>Warranty:</strong> Manufacturer policy applies</p>
      </div>
      <div class="step" data-testid="checkout-journey-state">Step 2 of 2 · Order summary</div>
    </section>
  </div></div>
<script>
  document.querySelector('[data-testid="continue-to-checkout"]').addEventListener('click', () => {
    document.querySelector('[data-testid="checkout-panel"]').hidden = false;
    document.querySelector('[data-testid="journey-state"]').textContent = 'Step 2 of 2 · Order summary opened';
  });
</script>
</body></html>`;
}
