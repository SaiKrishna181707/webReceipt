import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

const PUBLIC_ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const MAX_JSON_BYTES = 256 * 1024;

export class HttpError extends Error {
  constructor(status, message, code = 'request_error') {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function securityHeaders({ fixture = false } = {}) {
  const csp = fixture
    ? "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    : "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
  };
}

export async function readJson(req, { maxBytes = MAX_JSON_BYTES } = {}) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > maxBytes) throw new HttpError(413, `Request body exceeds ${maxBytes} bytes.`, 'body_too_large');
    chunks.push(buffer);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.', 'invalid_json');
  }
}

export function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    ...securityHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(JSON.stringify(body));
}

export function html(res, status, body, { fixture = false, extraHeaders = {} } = {}) {
  res.writeHead(status, {
    ...securityHeaders({ fixture }),
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

export function attachmentHeaders(filename) {
  const safe = String(filename || 'webreceipt.json')
    .replace(/[\r\n"\\/]/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || 'webreceipt.json';
  return {
    ...securityHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="${safe}"`,
    'Cache-Control': 'no-store'
  };
}

export async function staticFile(res, pathname, { head = false } = {}) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { return false; }
  const safe = decoded === '/' ? '/index.html' : decoded;
  const target = path.resolve(PUBLIC_ROOT, `.${safe}`);
  const relative = path.relative(PUBLIC_ROOT, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return false;
  try {
    const stat = await fs.stat(target);
    if (!stat.isFile()) return false;
    res.writeHead(200, {
      ...securityHeaders(),
      'Content-Type': MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': String(stat.size),
      'Cache-Control': 'no-cache'
    });
    if (head) {
      res.end();
      return true;
    }
    res.end(await fs.readFile(target));
    return true;
  } catch {
    return false;
  }
}
