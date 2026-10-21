import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';

const env = { ORIGIN_HOSTNAME: 'main--site--org.aem.live', PUSH_INVALIDATION: 'disabled' };

async function originHeadersFor(path) {
  let seen;
  globalThis.fetch = async (req) => {
    seen = req.headers;
    return new Response('<div>x</div>', { status: 200, headers: { 'content-type': 'text/html' } });
  };
  await worker.fetch(new Request(`https://example.com${path}`, {
    headers: { host: 'example.com', 'if-none-match': '"abc"', 'if-modified-since': 'Wed, 21 Oct 2026 04:14:14 GMT' },
  }), env);
  return seen;
}

test('strips conditional headers for HTML page requests', async () => {
  for (const path of ['/en/club/members', '/en/club/members.plain.html']) {
    const h = await originHeadersFor(path);
    assert.equal(h.get('if-none-match'), null, path);
    assert.equal(h.get('if-modified-since'), null, path);
  }
});

test('keeps conditional headers for static assets', async () => {
  const h = await originHeadersFor('/scripts/scripts.js');
  assert.equal(h.get('if-none-match'), '"abc"');
});
