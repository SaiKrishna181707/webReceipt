function moneyChange(path, before, after) {
  if (!before || !after || before.amount === after.amount) return null;
  return { path, kind: 'money', before: before.amount, after: after.amount, currency: after.currency, delta: after.amount - before.amount };
}

export function diffContracts(before, after) {
  if (!before || !after) return [];
  const changes = [
    moneyChange('offer.advertisedPrice', before.offer.advertisedPrice, after.offer.advertisedPrice),
    moneyChange('checkout.mandatoryFees', before.checkout.mandatoryFees, after.checkout.mandatoryFees),
    moneyChange('checkout.taxes', before.checkout.taxes, after.checkout.taxes),
    moneyChange('checkout.finalTotal', before.checkout.finalTotal, after.checkout.finalTotal)
  ].filter(Boolean);

  const scalar = [
    ['terms.cancellation', before.terms.cancellation, after.terms.cancellation],
    ['terms.refundability', before.terms.refundability, after.terms.refundability],
    ['terms.paymentTiming', before.terms.paymentTiming, after.terms.paymentTiming]
  ];
  for (const [path, a, b] of scalar) if (a !== b) changes.push({ path, kind: 'text', before: a, after: b });

  const beforeInclusions = before.terms.inclusions.join('|');
  const afterInclusions = after.terms.inclusions.join('|');
  if (beforeInclusions !== afterInclusions) changes.push({ path: 'terms.inclusions', kind: 'list', before: before.terms.inclusions, after: after.terms.inclusions });
  return changes;
}
