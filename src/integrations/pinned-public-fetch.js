import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { assertPublicTarget, isPrivateNetworkHost } from '../domain/target-policy.js';

const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_TIMEOUT_MS = 20_000;
const BRIGHT_DATA_REQUEST_URL = 'https://api.brightdata.com/request';

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function headerBag(headers) {
  return {
    get(name) {
      const value = headers[String(name || '').toLowerCase()];
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
  return addresses[0];
}

function makeResponse(status, headers, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: headerBag(headers),
    body: null,
    async text() { return body; },
    async json() { return JSON.parse(body); },
  };
}

async function pinnedRequest(input, init = {}) {
  const normalized = assertPublicTarget(String(input));
  const target = new URL(normalized);
  const resolved = await resolvePublicAddress(target.hostname);
  const transport = target.protocol === 'https:' ? https : http;
  const timeoutMs = envNumber('PUBLIC_WEB_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const maxBytes = envNumber('PUBLIC_WEB_MAX_BYTES', DEFAULT_MAX_BYTES);
  const method = String(init.method || 'GET').toUpperCase();

  if (method !== 'GET' && method !== 'HEAD') throw new Error(`Public page fetch does not allow ${method} requests.`);

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      init.signal?.removeEventListener?.('abort', onAbort);
      fn(value);
    };
    const onAbort = () => request.destroy(new Error(`Public page fetch timed out after ${timeoutMs}ms.`));

    const request = transport.request(target, {
      method,
      headers: init.headers || {},
      family: resolved.family,
      autoSelectFamily: false,
      agent: false,
      // Pin this socket to the address that passed the public-network check.
      // The URL hostname is preserved for Host and TLS SNI/certificate checks.
      lookup: (_hostname, _options, callback) => callback(null, resolved.address, resolved.family),
    }, (response) => {
      const status = Number(response.statusCode || 0);
      const headers = response.headers || {};
      if ([301, 302, 303, 307, 308].includes(status)) {
        response.resume();
        finish(resolve, makeResponse(status, headers, ''));
        return;
      }

      const declared = Number(headers['content-length']);
      if (Number.isFinite(declared) && declared > maxBytes) {
        response.destroy();
        finish(reject, new Error(`Public page response exceeds ${maxBytes} bytes.`));
        return;
      }

      const encoding = String(headers['content-encoding'] || 'identity').toLowerCase();
      if (encoding && encoding !== 'identity') {
        response.destroy();
        finish(reject, new Error(`Public page returned unsupported content encoding: ${encoding}.`));
        return;
      }

      const chunks = [];
      let total = 0;
      response.on('data', (chunk) => {
        total += chunk.length;
        if (total > maxBytes) {
          response.destroy(new Error(`Public page response exceeds ${maxBytes} bytes.`));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => finish(resolve, makeResponse(status, headers, Buffer.concat(chunks).toString('utf8'))));
      response.on('error', (error) => finish(reject, error));
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

// Public pages use a socket-pinned Node request to eliminate the DNS-check / DNS-
// connect gap. Bright Data itself is a fixed trusted upstream and keeps native
// fetch so POST bodies, bearer auth, and its response semantics remain standard.
export async function securePublicFetch(input, init = {}) {
  if (String(input) === BRIGHT_DATA_REQUEST_URL) return fetch(input, init);
  return pinnedRequest(input, init);
}
