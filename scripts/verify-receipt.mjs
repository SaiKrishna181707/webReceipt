#!/usr/bin/env node
import fs from 'node:fs/promises';
import { verifyReceiptBundle } from '../src/domain/verify.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run verify:receipt -- <webreceipt.json>');
  process.exitCode = 2;
} else {
  try {
    const bundle = JSON.parse(await fs.readFile(file, 'utf8'));
    const result = verifyReceiptBundle(bundle);
    console.log(JSON.stringify({
      valid: result.valid,
      dealId: result.dealId,
      subject: result.subject,
      observedAt: result.observedAt,
      contractHash: result.contractHash,
      integrity: {
        status: result.integrity.status,
        passed: result.integrity.passed,
        total: result.integrity.total,
        failures: result.integrity.failures.map((failure) => failure.id),
      },
    }, null, 2));
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error(`WebReceipt verification failed: ${error.message}`);
    process.exitCode = 2;
  }
}
