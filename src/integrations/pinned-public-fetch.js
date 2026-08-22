import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import { assertPublicTarget, isPrivateNetworkHost } from '../domain/target-policy.js';

const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_TIMEOUT_MS = 20_000;
const BRIGHT_DATA_REQUEST_URL = 'https://api.brightdata.com/request';
const MAX_COMPRESSED_MULTIPLIER = 4;

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function headerBag(headers, bodyLength) {
  const normalized = { ...headers };
  // The body exposed by this fetch shim is already decoded. Do not leave stale
  // transport encoding/length metadata that describes the compressed wire body.
  delete normalized['content-encoding'];
  normalized['content-length'] = String(bodyLength);
  return {
    get(name) {
      const value = normalized[String(name || '').toLowerCase()];
      if (Array.isArray(value)) return value.join(', ');
      return value == null ? null : String(value);
    },
  };
}

async function resolvePublicAddress(hostname) {
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch (error) {
    throw new Error(`Target hostname could not be resolved: ${error?.message || error}`);
  }
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error('Target hostname did not resolve to a public address.');
  }
  if (addresses.some((entry) => isPrivateNetworkHost(entry?.address))) {
    throw new Error('Target hostname resolves to a private/reserved network address and cannot be fetched.');
  }
  // Pin to one address from the exact DNS answer set that was validated above.
  // A new DNS lookup is never performed when the TCP socket is opened.
  return addresses[0];
}

function makeResponse(status, headers, body) {
  const length = Buffer.byteLength(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: headerBag(headers, length),
    body: null,
    async text() { return body; },
    async json() { return JSON.parse(body); },
  };
}

function decodedStream(response, encoding) {
  const value = String(encoding || 'identity').trim().toLowerCase();
  if (!value || value === 'identity') return response;
  if (value === 'gzip' || value === 'x-gzip') return response.pipe(createGunzip());
  if (value === 'deflate') return response.pipe(createInflate());
  if (value === 'br') return response.pipe(createBrotliDecompress());
  throw new Error(`Public page returned unsupported content encoding: ${value}.`);
}

async function pinnedRequest(input, init = {}) {
  const normalized = assertPublicTarget(String(input));
  const target = new URL(normalized);
  const resolved = await resolvePublicAddress(target.hostname);
  const transport = target.protocol === 'https:' ? https : http;
  const timeoutMs = envNumber('PUBLIC_WEB_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const maxBytes = envNumber('PUBLIC_WEB_MAX_BYTES', DEFAULT_MAX_BYTES);
  const maxWireBytes = maxBytes * MAX_COMPRESSED_MULTIPLIER;
  const method = String(init.method || 'GET').toUpperCase();

  if (method !== 'GET' && method !== 'HEAD') {
    throw new Error(`Public page fetch does not allow ${method} requests.`);
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let request;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      init.signal?.removeEventListener?.('abort', onAbort);
      fn(value);
    };
    const onAbort = () => request?.destroy(new Error(`Public page fetch timed out after ${timeoutMs}ms.`));

    const requestOptions = {
      method,
      headers: init.headers || {},
      family: resolved.family,
      autoSelectFamily: false,
      agent: false,
      // Critical SSRF invariant: connect only to the exact address that passed
      // the public-network check. Keep the original hostname for Host and TLS.
      lookup: (_hostname, _options, callback) => callback(null, resolved.address, resolved.family),
    };
    if (target.protocol === 'https:' && !net.isIP(target.hostname)) requestOptions.servername = target.hostname;

    request = transport.request(target, requestOptions, (response) => {
      const status = Number(response.statusCode || 0);
      const headers = response.headers || {};

      // Redirects are deliberately handled by PublicWebCollector, which validates
      // and re-pins every Location hop independently before following it.
      if ([301, 302, 303, 307, 308].includes(status) || method === 'HEAD' || status < 200 || status >= 300) {
        response.resume();
        finish(resolve, makeResponse(status, headers, ''));
        return;
      }

      const encoding = String(headers['content-encoding'] || 'identity').toLowerCase();
      const declared = Number(headers['content-length']);
      const wireLimit = encoding && encoding !== 'identity' ? maxWireBytes : maxBytes;
      if (Number.isFinite(declared) && declared > wireLimit) {
        response.destroy();
        finish(reject, new Error(`Public page response exceeds ${maxBytes} bytes.`));
        return;
      }

      let source;
      try {
        source = decodedStream(response, encoding);
      } catch (error) {
        response.destroy();
        finish(reject, error);
        return;
      }

      const chunks = [];
      let decodedTotal = 0;
      let wireTotal = 0;

      response.on('data', (chunk) => {
        wireTotal += chunk.length;
        if (wireTotal > wireLimit) response.destroy(new Error(`Public page response exceeds ${maxBytes} bytes.`));
      });
      response.on('error', (error) => finish(reject, error));
      if (source !== response) source.on('error', (error) => finish(reject, error));

      source.on('data', (chunk) => {
        decodedTotal += chunk.length;
        if (decodedTotal > maxBytes) {
          response.destroy();
          source.destroy?.();
          finish(reject, new Error(`Public page response exceeds ${maxBytes} bytes.`));
          return;
        }
        chunks.push(Buffer.from(chunk));
      });
      source.on('end', () => {
        if (settled) return;
        const body = Buffer.concat(chunks).toString('utf8');
        finish(resolve, makeResponse(status, headers, body));
      });
    });

    request.setTimeout(timeoutMs, () => request.destroy(new Error(`Public page fetch timed out after ${timeoutMs}ms.`)));
    request.on('error', (error) => finish(reject, error));
    if (init.signal) {
      if (init.signal.aborted) onAbort();
      else init.signal.addEventListener('abort', onAbort, { once: true });
    }
    request.end();
  });
}

// Public targets use the DNS-pinned request above. Bright Data is a fixed trusted
// upstream and keeps native fetch because it requires authenticated POST bodies.
export async function securePublicFetch(input, init = {}) {
  if (String(input) === BRIGHT_DATA_REQUEST_URL) return fetch(input, init);
  return pinnedRequest(input, init);
}
