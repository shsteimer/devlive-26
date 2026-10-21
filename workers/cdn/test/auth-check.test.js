import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAuthenticated } from '../handlers/auth-check.js';

const TEAM = 'test-team.cloudflareaccess.com';
const AUD = 'test-aud';
const env = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD };

const b64url = (input) => {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function setup() {
  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const jwk = await crypto.subtle.exportKey('jwk', publicKey);
  const kid = crypto.randomUUID();
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [{ ...jwk, kid, alg: 'RS256' }] }));
  return async (payload) => {
    const header = b64url(JSON.stringify({ alg: 'RS256', kid }));
    const body = b64url(JSON.stringify(payload));
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${body}`));
    return `${header}.${body}.${b64url(sig)}`;
  };
}

const now = () => Math.floor(Date.now() / 1000);
const valid = () => ({
  iss: `https://${TEAM}`, aud: [AUD], exp: now() + 600, nbf: now() - 10, email: 'a@b.c',
});
const req = (headers) => new Request('https://example.com/en/club/members', { headers });

test('accepts a correctly signed cookie token', async () => {
  const sign = await setup();
  const token = await sign(valid());
  assert.equal(await isAuthenticated(req({ Cookie: `CF_Authorization=${token}` }), env), true);
});

test('rejects a token with a tampered payload', async () => {
  const sign = await setup();
  const [header, , sig] = (await sign(valid())).split('.');
  const forged = `${header}.${b64url(JSON.stringify({ ...valid(), email: 'attacker@evil.test' }))}.${sig}`;
  assert.equal(await isAuthenticated(req({ Cookie: `CF_Authorization=${forged}` }), env), false);
});

test('rejects spoofed Cf-Access headers', async () => {
  await setup();
  assert.equal(await isAuthenticated(req({
    'Cf-Access-Authenticated-User-Email': 'x@y.z',
    'Cf-Access-Jwt-Assertion': 'junk',
  }), env), false);
});

test('rejects wrong audience', async () => {
  const sign = await setup();
  const token = await sign({ ...valid(), aud: ['other'] });
  assert.equal(await isAuthenticated(req({ Cookie: `CF_Authorization=${token}` }), env), false);
});

test('rejects expired token', async () => {
  const sign = await setup();
  const token = await sign({ ...valid(), exp: now() - 3600 });
  assert.equal(await isAuthenticated(req({ Cookie: `CF_Authorization=${token}` }), env), false);
});
