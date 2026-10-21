import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyGatingIfNeeded } from '../handlers/gating.js';

const env = { ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com', ACCESS_AUD: 'aud' };

const PLAIN = `<div><h1>Members</h1></div>
<div data-view="logged-out"><h2>Sign in</h2></div>
<div data-view="logged-in"><h2>Secret offers</h2></div>`;

const FULL = `<html><head><meta name="gated" content="true"></head><body><main>${PLAIN}</main></body></html>`;

const MD = `# Members

| Section Metadata |  |
| --- | --- |
| view | logged-in |

## Secret offers

| Metadata |  |
| --- | --- |
| gated | true |
`;

async function run(path, body, contentType) {
  const url = new URL(`https://example.com${path}`);
  const request = new Request(url);
  const response = new Response(body, { status: 200, headers: { 'content-type': contentType } });
  const out = await applyGatingIfNeeded(request, url, response, env);
  return { status: out.status, text: await out.text() };
}

test('full gated page hides logged-in sections for anonymous', async () => {
  const { text } = await run('/en/club/members', FULL, 'text/html; charset=utf-8');
  assert.ok(!text.includes('Secret offers'));
  assert.ok(text.includes('Sign in'));
});

test('.plain.html of gated page hides logged-in sections for anonymous', async () => {
  const { text } = await run('/en/club/members.plain.html', PLAIN, 'text/html; charset=utf-8');
  assert.ok(!text.includes('Secret offers'));
  assert.ok(text.includes('Sign in'));
});

test('.md of gated page is not served', async () => {
  const { status, text } = await run('/en/club/members.md', MD, 'text/markdown; charset=utf-8');
  assert.equal(status, 404);
  assert.ok(!text.includes('Secret offers'));
});

test('non-gated .plain.html passes through unchanged', async () => {
  const html = '<div><h2>Public</h2></div>';
  const { text } = await run('/en/run.plain.html', html, 'text/html; charset=utf-8');
  assert.equal(text, html);
});

test('non-gated .md passes through', async () => {
  const md = '# Run\n\nPublic page\n';
  const { status, text } = await run('/en/run.md', md, 'text/markdown; charset=utf-8');
  assert.equal(status, 200);
  assert.equal(text, md);
});
