import net from 'node:net';

const BLOCKED_SEGMENTS = new Set(['login', 'signin', 'sign-in', 'account', 'my-account', 'private', 'paywall']);

function isBlockedIpv4(parts) {
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.+$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  const kind = net.isIP(host);
  if (kind === 4) return isBlockedIpv4(host.split('.').map(Number));
  if (kind === 6) {
    if (host === '::1' || host === '::') return true;
    if (host.startsWith('::ffff:')) return true; // reject IPv4-mapped IPv6 to avoid normalization bypasses
    if (/^f[cd][0-9a-f]{2}:/i.test(host)) return true; // unique-local fc00::/7
    if (/^fe[89ab][0-9a-f]:/i.test(host)) return true; // link-local fe80::/10
    const mapped = host.match(/::ffff:(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
    if (mapped) return isBlockedIpv4(mapped.slice(1).map(Number));
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

export function assertPublicTarget(rawUrl, { allowLocal = false } = {}) {
  let url;
  try { url = new URL(rawUrl); } catch { throw new Error('Target must be a valid URL.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http(s) public web URLs are allowed.');
  if (url.username || url.password) throw new Error('Credential-bearing URLs are not allowed.');
  if (!url.hostname) throw new Error('Target URL must include a hostname.');
  if (!allowLocal && isPrivateHostname(url.hostname)) throw new Error('Bright Data live mode only accepts publicly reachable targets, not localhost/private network addresses.');
  if (pathLooksPrivate(url.pathname)) throw new Error('Target looks login/private. WebReceipt only processes public anonymous pages.');
  url.hash = '';
  return url.toString();
}
