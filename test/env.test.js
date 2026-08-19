import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadEnvFileIfPresent, parseEnvText } from '../src/env.js';

test('zero-dependency env parser supports comments, export syntax and quoted hashes', () => {
  assert.deepEqual(parseEnvText(`\n# comment\nPORT=3000 # inline\nexport TOKEN="abc#123"\nEMPTY=\nSINGLE='hello world'\n`), {
    PORT:'3000', TOKEN:'abc#123', EMPTY:'', SINGLE:'hello world'
  });
});

test('optional env loader does not overwrite already configured environment values', async () => {
  const file = path.join(os.tmpdir(), `webreceipt-env-${randomUUID()}`);
  try {
    await fs.writeFile(file, 'PORT=9999\nNEW_KEY=loaded\n');
    const env = {PORT:'4000'};
    assert.equal(loadEnvFileIfPresent(file, env), true);
    assert.deepEqual(env, {PORT:'4000', NEW_KEY:'loaded'});
    assert.equal(loadEnvFileIfPresent(`${file}-missing`, env), false);
  } finally {
    await fs.unlink(file).catch(() => {});
  }
});
