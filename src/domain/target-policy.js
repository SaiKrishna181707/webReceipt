const BLOCKED_PATH_HINTS = ['/login', '/signin', '/account', '/me/', '/private', '/paywall'];

function isPrivateHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '::1' || host.endsWith('.local') || host.endsWith('.internal')) return true;
  const parts = host.split('.').map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    if (parts[0] === 10 || parts[0] === 127 || parts[0] === 0) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  }
  return false;
}

export function assertPublicTarget(rawUrl, { allowLocal = false } = {}) {
  let url;
  try { url = new URL(rawUrl); } catch { throw new Error('Target must be a valid URL.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http(s) public web URLs are allowed.');
  if (url.username || url.password) throw new Error('Credential-bearing URLs are not allowed.');
  if (!allowLocal && isPrivateHostname(url.hostname)) throw new Error('Bright Data live mode only accepts publicly reachable targets, not localhost/private network addresses.');
  if (BLOCKED_PATH_HINTS.some((hint) => url.pathname.toLowerCase().includes(hint))) throw new Error('Target looks login/private. WebReceipt only processes public anonymous pages.');
  return url.toString();
}
