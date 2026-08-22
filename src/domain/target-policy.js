import net from 'node:net';
import dns from 'node:dns/promises';

const BLOCKED_SEGMENTS = new Set(['login', 'signin', 'sign-in', 'account', 'my-account', 'private', 'paywall']);

function isBlockedIpv4(parts) {
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 0 && c === 0) return true; // IETF protocol assignments
  if (a === 192 && b === 0 && c === 2) return true; // documentation
  if (a === 192 && b === 88 && c === 99) return true; // deprecated 6to4 relay anycast
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // documentation
  if (a === 203 && b === 0 && c === 113) return true; // documentation
  if (a >= 224) return true; // multicast, reserved and broadcast space
  return false;
}

export function isPrivateNetworkHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.+$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  const kind = net.isIP(host);
  if (kind === 4) return isBlockedIpv4(host.split('.').map(Number));
  if (kind === 6) {
    if (host === '::1' || host === '::') return true;
    const mapped = host.match(/::ffff:(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
    if (mapped) return isBlockedIpv4(mapped.slice(1).map(Number));
    // Block all IPv4-mapped forms, including hexadecimal forms such as
    // ::ffff:7f00:1, because treating them as a separate address family can
    // otherwise bypass the IPv4 private-range rules above.
    if (host.startsWith('::ffff:')) return true;
    if (/^f[cd][0-9a-f]{2}:/i.test(host)) return true; // unique-local fc00::/7
    if (/^fe[89ab][0-9a-f]:/i.test(host)) return true; // link-local fe80::/10
    if (/^fe[c-f][0-9a-f]:/i.test(host)) return true; // deprecated site-local fec0::/10
    if (/^ff[0-9a-f]{2}:/i.test(host)) return true; // multicast
    if (/^2001:0?db8:/i.test(host)) return true; // documentation 2001:db8::/32
    if (/^100:/i.test(host)) return true; // discard-only 100::/64
  }
  return false;
}

function decodeSegment(segment) {
  let current = segment;
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current.toLowerCase();
}

function pathLooksPrivate(pathname) {
  const segments = pathname.split('/').filter(Boolean).flatMap((segment) => decodeSegment(segment).split(/[\\/]/).filter(Boolean));
  return segments.some((segment) => BLOCKED_SEGMENTS.has(segment));
}

function normalizeTargetInput(rawUrl) {
  const value = String(rawUrl ?? '').trim();
  if (!value) throw new Error('Target must be a valid URL.');
  if (value.startsWith('//')) return `https:${value}`;
  if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) return `https://${value}`;
  return value;
}

export function assertPublicTarget(rawUrl, { allowLocal = false } = {}) {
  let url;
  try { url = new URL(normalizeTargetInput(rawUrl)); } catch { throw new Error('Target must be a valid URL.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http(s) public web URLs are allowed.');
  if (url.username || url.password) throw new Error('Credential-bearing URLs are not allowed.');
  if (!url.hostname) throw new Error('Target URL must include a hostname.');
  // Anonymous production scraping should not be usable as a generic TCP proxy
  // into services exposed on unusual ports. Local simulator fixtures are the
  // only exception because local development commonly runs on an ephemeral port.
  if (!allowLocal && url.port && !((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443'))) {
    throw new Error('Only http(s) public web URLs on standard ports 80 and 443 are allowed.');
  }
  if (!allowLocal && isPrivateNetworkHost(url.hostname)) throw new Error('Live web mode only accepts publicly reachable targets, not localhost/private network addresses.');
  if (pathLooksPrivate(url.pathname)) throw new Error('Target looks login/private. WebReceipt only processes public anonymous pages.');
  url.hash = '';
  return url.toString();
}

export async function assertPublicNetworkTarget(rawUrl, { lookup = dns.lookup } = {}) {
  const normalized = assertPublicTarget(rawUrl);
  const url = new URL(normalized);
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, ''))) return normalized;

  let addresses;
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true });
  } catch (error) {
    throw new Error(`Target hostname could not be resolved: ${error?.message || error}`);
  }
  if (!Array.isArray(addresses) || addresses.length === 0) throw new Error('Target hostname did not resolve to a public address.');
  const blocked = addresses.find((entry) => isPrivateNetworkHost(entry?.address));
  if (blocked) throw new Error('Target hostname resolves to a private/reserved network address and cannot be fetched.');
  return normalized;
}
