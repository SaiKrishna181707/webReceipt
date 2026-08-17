export function detectAnomalies(contract) {
  const anomalies = [];
  const advertised = contract.offer.advertisedPrice.amount;
  const final = contract.checkout.finalTotal.amount;
  const requiredFees = contract.checkout.mandatoryFees.amount;

  if (final > advertised) {
    anomalies.push({
      id: 'observed_price_increase',
      label: 'Observed price increase',
      severity: final / advertised >= 1.15 ? 'high' : 'medium',
      value: `${(((final - advertised) / advertised) * 100).toFixed(1)}%`,
      details: `Final observed total is ${final - advertised} ${contract.checkout.finalTotal.currency} above the advertised price.`
    });
  }
  if (requiredFees > 0) anomalies.push({ id: 'mandatory_charges', label: 'Mandatory charges observed', severity: 'info', value: `${requiredFees} ${contract.checkout.mandatoryFees.currency}`, details: 'Required non-tax charges were present in the observed checkout breakdown.' });
  return anomalies;
}
