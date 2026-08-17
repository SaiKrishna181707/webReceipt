export function detectAnomalies(contract) {
  const anomalies = [];
  const advertised = contract.offer.advertisedPrice.amount;
  const final = contract.checkout.finalTotal.amount;
  const requiredFees = contract.checkout.mandatoryFees.amount;
  const taxes = contract.checkout.taxes.amount;
  const currency = contract.checkout.finalTotal.currency;

  if (final > advertised) {
    const delta = final - advertised;
    const ratio = advertised > 0 ? delta / advertised : null;
    anomalies.push({
      id: 'observed_price_increase',
      label: 'Observed journey price increase',
      severity: ratio == null || ratio >= 0.15 ? 'high' : 'medium',
      value: ratio == null ? `+${delta} ${currency}` : `${(ratio * 100).toFixed(1)}%`,
      details: `Final observed total is ${delta} ${currency} above the advertised price; this observation includes taxes and required charges and is not a legal conclusion.`
    });
  }
  if (requiredFees > 0) {
    anomalies.push({
      id: 'mandatory_charges',
      label: 'Mandatory non-tax charges observed',
      severity: 'info',
      value: `${requiredFees} ${currency}`,
      details: 'Required non-tax charges were present in the observed checkout breakdown.'
    });
  }
  if (taxes > 0) {
    anomalies.push({
      id: 'taxes_observed',
      label: 'Taxes observed',
      severity: 'info',
      value: `${taxes} ${currency}`,
      details: 'Taxes are reported separately so they are not conflated with platform or property fees.'
    });
  }
  return anomalies;
}
