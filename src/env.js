import fs from 'node:fs';
import path from 'node:path';

function parseValue(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  const quote = value[0];
  if (["'", '"', '`'].includes(quote) && value.at(-1) === quote) return value.slice(1, -1);
  const comment = value.search(/\s+#/);
  return (comment >= 0 ? value.slice(0, comment) : value).trimEnd();
}

export function parseEnvText(text) {
  const out = {};
  for (const rawLine of String(text ?? '').split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice(7).trimStart();
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    out[match[1]] = parseValue(match[2]);
  }
  return out;
}

export function loadEnvFileIfPresent(file = '.env', env = process.env) {
  const resolved = path.resolve(file);
  let text;
  try { text = fs.readFileSync(resolved, 'utf8'); }
  catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  for (const [key, value] of Object.entries(parseEnvText(text))) {
    if (env[key] === undefined) env[key] = value;
  }
  return true;
}
