const DEFAULT_MAX_JSON_BYTES = 256 * 1024;

export class WebRequestError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'WebRequestError';
    this.status = status;
    this.code = code;
  }
}

function contentLength(req) {
  const raw = req?.headers?.get?.('content-length');
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export async function readWebJson(req, { maxBytes = DEFAULT_MAX_JSON_BYTES } = {}) {
  const declared = contentLength(req);
  if (declared != null && declared > maxBytes) {
    throw new WebRequestError(413, `Request body exceeds ${maxBytes} bytes.`, 'body_too_large');
  }

  if (!req?.body) return {};
  const reader = req.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new WebRequestError(413, `Request body exceeds ${maxBytes} bytes.`, 'body_too_large');
      }
      chunks.push(value);
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }

  if (!total) return {};
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let parsed;
  try {
    // Fatal UTF-8 decoding prevents invalid byte sequences from being silently
    // rewritten with U+FFFD before JSON parsing.
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(merged);
    parsed = JSON.parse(decoded);
  } catch {
    throw new WebRequestError(400, 'Request body must be valid UTF-8 JSON.', 'invalid_json');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new WebRequestError(400, 'Request body must be a JSON object.', 'invalid_json');
  }
  return parsed;
}
