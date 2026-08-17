export function renderHotelFixture(version = 'v1') {
  const broken = version === 'v2';
  const finalMarkup = broken
    ? `<div class="legacy"><span>Subtotal</span><strong class="total-price">₹8,499</strong></div><div class="actual-total redesigned-total" data-testid="order-total"><span>Total due today</span><strong><span class="currency-symbol">₹</span><span class="major">10,147</span></strong></div>`
    : `<div class="actual-total"><span>Total due today</span><strong class="total-price" data-testid="order-total">₹10,147</strong></div>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ocean House — WebReceipt Fixture</title>
<style>
  body{margin:0;background:#f4f1ea;color:#182019;font-family:system-ui,sans-serif}.wrap{max-width:920px;margin:60px auto;padding:0 24px}.tag{font-size:12px;text-transform:uppercase;letter-spacing:.13em;color:#57665a}.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:28px}.hero,.box{background:white;border:1px solid #d9d6cc;border-radius:18px;padding:28px}.hero h1{font-size:42px;margin:8px 0}.price{font-size:34px;font-weight:900}.claim{display:inline-block;background:#edf7e7;padding:8px 10px;border-radius:9px;margin:7px 5px 0 0}.row,.actual-total,.legacy{display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #ece9e0}.actual-total{font-size:22px;border:0;padding-top:22px}.legacy{color:#69746b}.terms{margin-top:22px}.version{position:fixed;right:16px;top:16px;background:#182019;color:white;padding:8px 10px;border-radius:8px;font-size:11px}.cta{margin-top:22px;border:0;border-radius:12px;background:#182019;color:white;padding:13px 18px;font-weight:800;cursor:pointer}.step{margin-top:14px;font-size:13px;color:#647064}.box[hidden]{display:none}.notice{font-size:13px;color:#5f695f;margin-top:12px}
  @media(max-width:760px){.grid{grid-template-columns:1fr}.wrap{margin:30px auto}.hero h1{font-size:34px}}
</style></head>
<body>
  <div class="version">fixture ${version}</div>
  <div class="wrap">
    <div class="grid">
      <section class="hero" data-testid="offer-panel">
        <div class="tag" data-testid="offer-name">Ocean House · Deluxe Room</div>
        <h1>A quiet night by the sea.</h1>
        <div class="price" data-testid="advertised-price">₹8,499</div>
        <span class="claim">Free cancellation</span><span class="claim">Breakfast included</span>
        <p>1 night · 2 guests · public demo offer</p>
        <button class="cta" type="button" data-testid="continue-to-checkout">Continue to checkout</button>
        <div class="step" data-testid="journey-state">Step 1 of 2 · Offer</div>
        <div class="notice">No account, personal data, or payment is required in this public fixture.</div>
      </section>

      <section class="box" data-testid="checkout-panel" hidden>
        <div class="tag">Order summary</div>
        <div class="row"><span>Room price</span><strong data-testid="base-price">₹8,499</strong></div>
        <div class="row"><span>Property fee</span><strong class="fee-property">₹499</strong></div>
        <div class="row"><span>Service fee</span><strong class="fee-service">₹349</strong></div>
        <div class="row"><span>Taxes</span><strong data-testid="tax">₹800</strong></div>
        ${finalMarkup}
        <div class="terms">
          <p id="cancellation"><strong>Cancellation:</strong> Free cancellation until 21 Aug</p>
          <p id="refundability"><strong>Refundability:</strong> Refundable</p>
          <p id="payment-timing"><strong>Payment:</strong> Pay now</p>
          <p id="inclusions"><strong>Includes:</strong> Breakfast</p>
        </div>
        <div class="step">Step 2 of 2 · Checkout summary</div>
      </section>
    </div>
  </div>
<script>
  document.querySelector('[data-testid="continue-to-checkout"]').addEventListener('click', () => {
    document.querySelector('[data-testid="checkout-panel"]').hidden = false;
    document.querySelector('[data-testid="journey-state"]').textContent = 'Step 2 of 2 · Checkout opened';
  });
</script>
</body></html>`;
}
