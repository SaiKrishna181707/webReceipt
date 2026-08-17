import { evaluateIntegrity } from './integrity.js';

export function verifyReceiptBundle(bundle) {
  const contract = bundle?.contract ?? bundle;
  if (!contract || typeof contract !== 'object') throw new Error('Receipt bundle does not contain a Deal Contract.');
  if (!contract.contractHash) throw new Error('Deal Contract is missing contractHash.');
  const integrity = evaluateIntegrity(contract);
  return {
    valid: integrity.status === 'valid',
    dealId: contract.dealId ?? null,
    subject: contract.subject ?? null,
    observedAt: contract.observedAt ?? null,
    contractHash: contract.contractHash,
    integrity,
  };
}
