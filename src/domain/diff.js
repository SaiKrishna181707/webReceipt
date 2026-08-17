function moneyChange(path, before, after) {
  if (!before || !after || (before.amount === after.amount && before.currency === after.currency)) return null;
  return { path, kind: 'money', before: before.amount, after: after.amount, currency: after.currency, delta: after.amount - before.amount };
}

function listChange(path, before = [], after = []) {
  if (JSON.stringify(before) === JSON.stringify(after)) return null;
  return { path, kind: 'list', before, after };
}

function feeMap(items = []) {
  return new Map(items.map((x) => [x.label, x]));
}

export function diffContracts(before, after) {
  if (!before || !after) return [];
  const changes = [
    moneyChange('offer.advertisedPrice', before.offer.advertisedPrice, after.offer.advertisedPrice),
    moneyChange('checkout.basePrice', before.checkout.basePrice, after.checkout.basePrice),
    moneyChange('checkout.mandatoryFees', before.checkout.mandatoryFees, after.checkout.mandatoryFees),
    moneyChange('checkout.taxes', before.checkout.taxes, after.checkout.taxes),
    moneyChange('checkout.optionalAddons', before.checkout.optionalAddons, after.checkout.optionalAddons),
    moneyChange('checkout.discounts', before.checkout.discounts, after.checkout.discounts),
    moneyChange('checkout.finalTotal', before.checkout.finalTotal, after.checkout.finalTotal),
    listChange('offer.claims', before.offer.claims, after.offer.claims)
  ].filter(Boolean);

  const scalar = [
    ['terms.cancellation', before.terms.cancellation, after.terms.cancellation],
    ['terms.refundability', before.terms.refundability, after.terms.refundability],
    ['terms.paymentTiming', before.terms.paymentTiming, after.terms.paymentTiming]
  ];
  for (const [path, a, b] of scalar) if (a !== b) changes.push({ path, kind: 'text', before: a, after: b });

  const inclusionChange = listChange('terms.inclusions', before.terms.inclusions, after.terms.inclusions);
  if (inclusionChange) changes.push(inclusionChange);

  const beforeFees = feeMap(before.checkout.feeItems);
  const afterFees = feeMap(after.checkout.feeItems);
  for (const label of [...new Set([...beforeFees.keys(), ...afterFees.keys()])].sort()) {
    const a = beforeFees.get(label);
    const b = afterFees.get(label);
    if (!a && b) changes.push({ path: `checkout.feeItems.${label}`, kind: 'fee_added', before: null, after: b.amount, currency: b.currency });
    else if (a && !b) changes.push({ path: `checkout.feeItems.${label}`, kind: 'fee_removed', before: a.amount, after: null, currency: a.currency });
    else {
      const change = moneyChange(`checkout.feeItems.${label}`, a, b);
      if (change) changes.push(change);
    }
  }
  return changes;
}
