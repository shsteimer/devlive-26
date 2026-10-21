# CDN worker

Proxies to `ORIGIN_HOSTNAME` and may rewrite HTML for gated pages (`handlers/gating.js`).

**Auth (delivery):** `handlers/auth-check.js` — verifies the `CF_Authorization` cookie (or `Cf-Access-Jwt-Assertion`) as an RS256 JWT against the Access team certs, checking issuer, audience (`ACCESS_AUD`) and expiry. Tests: `npm test`.

**Dependencies:** `cheerio` is installed under `workers/cdn/` (not the repo root). `npm run deploy:cdn` runs `npm install --prefix ./workers/cdn` first so Wrangler can bundle it.

**Deploy:** `npm run deploy:cdn`

**Auth worker** (`/auth/*`) is separate — route **`devlive.shsteimer.com/auth/*`** should stay **more specific** than **`devlive.shsteimer.com/*`** if both are on the same zone.

**Skips gating:** `/fragments/`, `/nav.plain.html`, `/footer.plain.html`

**Gated responses:** `Cache-Control: private, no-cache, must-revalidate`, `Vary: Cookie` (when the gated meta is present and the body changes).

**Optional:** `ORIGIN_AUTHENTICATION` in `[vars]` for Helix token auth to origin.
