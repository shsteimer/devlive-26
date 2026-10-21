/**
 * Cloudflare Access: verify the `CF_Authorization` cookie (or `Cf-Access-Jwt-Assertion`
 * header) as an RS256 JWT signed by the Access team, issued for this app's audience.
 */
const SKEW_SEC = 60;
const CERTS_TTL_MS = 60 * 60 * 1000;

let certsCache = { url: '', keys: null, fetchedAt: 0 };

function getCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return '';
}

function base64UrlToBytes(segment) {
  let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(segment) {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
  } catch {
    return null;
  }
}

async function getKeys(teamDomain, forceRefresh = false) {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  const fresh = certsCache.url === url && Date.now() - certsCache.fetchedAt < CERTS_TTL_MS;
  if (fresh && !forceRefresh) return certsCache.keys;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const { keys = [] } = await resp.json();
  certsCache = { url, keys, fetchedAt: Date.now() };
  return keys;
}

async function findKey(teamDomain, kid) {
  let jwk = (await getKeys(teamDomain)).find((k) => k.kid === kid);
  if (!jwk) jwk = (await getKeys(teamDomain, true)).find((k) => k.kid === kid);
  if (!jwk) return null;
  return crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

function claimsOk(payload, teamDomain, aud) {
  if (!payload || payload.iss !== `https://${teamDomain}`) return false;
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now - SKEW_SEC) return false;
  if (typeof payload.nbf === 'number' && payload.nbf > now + SKEW_SEC) return false;
  return true;
}

export async function verifyAccessJwt(token, { ACCESS_TEAM_DOMAIN, ACCESS_AUD } = {}) {
  if (!token || !ACCESS_TEAM_DOMAIN || !ACCESS_AUD) return false;
  const parts = String(token).split('.');
  if (parts.length !== 3) return false;
  const header = decodeJson(parts[0]);
  if (!header || header.alg !== 'RS256' || !header.kid) return false;
  if (!claimsOk(decodeJson(parts[1]), ACCESS_TEAM_DOMAIN, ACCESS_AUD)) return false;
  try {
    const key = await findKey(ACCESS_TEAM_DOMAIN, header.kid);
    if (!key) return false;
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
  } catch {
    return false;
  }
}

/**
 * @param {Request} request
 * @param {{ ACCESS_TEAM_DOMAIN: string, ACCESS_AUD: string }} env
 */
export async function isAuthenticated(request, env) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || getCookie(request, 'CF_Authorization');
  return verifyAccessJwt(token, env);
}
