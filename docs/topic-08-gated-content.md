# Topic 8 – "Our site is behind a login or has gated content. Is Edge Delivery even an option?"

Short answer: **Yes.** Pages stay static and cacheable. Access control happens at the CDN edge, in front of EDS, using your existing identity provider. Authors mark what is gated in the document itself.

## Demo URLs

| What | URL |
|---|---|
| Gated page (production domain) | https://devlive.shsteimer.com/en/us/club/members |
| Same page, author preview (toggle) | https://main--devlive-26--shsteimer.aem.page/en/club/members |
| Author preview, signed-in view | https://main--devlive-26--shsteimer.aem.page/en/club/members?auth=true |
| Session endpoint | https://devlive.shsteimer.com/auth/session |
| Source doc in DA | https://da.live/edit#/shsteimer/devlive-26/en/club/members |

## How it works (architecture)

```
Browser ──► Cloudflare (devlive.shsteimer.com)
              ├─ /auth/*  ──► Cloudflare Access (IdP: email one-time PIN)
              │                └─► auth worker: /auth/login, /auth/logout, /auth/session
              └─ /*       ──► CDN worker ──► EDS origin (main--devlive-26--shsteimer.aem.live)
                                 │
                                 └─ if page has  gated=true :
                                      verify CF_Authorization JWT (signature, issuer, audience, expiry)
                                      strip sections the visitor shouldn't see
                                      respond private / no-cache / Vary: Cookie
```

- **Identity**: Cloudflare Access (Zero Trust) with one-time PIN by email. It can be swapped for any IdP Access supports (Okta, Entra ID, Google, SAML/OIDC). EDS doesn't care.
- **Login**: only `/auth/*` is behind Access, so the rest of the site stays public and fully cached. After login, Access sets the `CF_Authorization` cookie (a signed JWT) on the domain.
- **Enforcement**: the CDN worker (`workers/cdn`) checks the JWT on every request for a gated page, then removes sections server-side. Hidden content **never reaches the browser**. It is not just hidden with CSS or JS.
- **Caching**: non-gated pages are cached at the edge as normal. Gated page responses are rewritten per visitor and marked `private, no-cache`, `Vary: Cookie`. The origin response itself is still edge-cached.
- **UI**: the header turns an authored "Sign in" link (`/auth/login`) into Sign in / Sign out. It calls `/auth/session` to find out who is signed in.

## Authoring model (what authors do in the document)

1. Page metadata: `gated` = `true`.
2. Each section that should only show to one audience gets **section metadata** `view` = `logged-in` or `logged-out`.
3. Optional, at block level: add the variant `logged-in` / `logged-out` to a block, e.g. `Cards (logged-in)`.
4. Sections with no `view` show to everyone.

Members page example:
- Hero: everyone
- "Sign in to see your member offers": `logged-out`
- "Your member offers" (product cards): `logged-in`
- "Copenhagen Marathon 2027": `logged-in`

## Author preview experience

On preview hosts (`aem.page`, `localhost`, DA preview), a floating **"AUTH STATE"** tab appears on gated pages. Authors switch between Anonymous and Authenticated (`?auth=true`) to check both versions without logging in. This toggle is preview-only. Production gating is enforced only by the CDN worker.

## Demo script (suggested)

1. Open the members page on the production domain while signed out. Only the sign-in prompt shows.
2. View source or `curl`: the member offers are **not in the HTML**. They were stripped at the edge, not hidden.
3. Click **Sign in**. Cloudflare Access login, enter the email and the one-time code, then back on the page with member offers and the marathon section visible. The header shows **Sign out**.
4. Optional: `/auth/session` shows `authenticated: true` and the email.
5. Switch to DA and show the document: the `gated` metadata and the `view` section metadata. "This is all the author does."
6. Preview on `aem.page` and use the **AUTH STATE** toggle to flip views.
7. Optional (security credibility): show a forged cookie being rejected (see below).

## Talking points

- Gating lives at the **edge, not in the page code**. Same pattern on Akamai, Fastly or Adobe-managed CDN (edge functions / EdgeWorkers / Compute).
- **Bring your own IdP.** Access is just one example; the pattern is "edge validates a token".
- **Performance is kept.** Public pages are untouched and fully cached. Only gated pages are personalized.
- **Author-friendly.** Gating is document metadata, not a developer ticket.
- **Whole-site login** is even simpler: put the entire hostname behind Access (or use EDS site authentication) with no worker logic.
- EDS also has built-in **site authentication** for preview/live (token-protected origins). That complements this pattern.

## Security notes (useful for Q&A)

- The worker verifies the JWT **signature** against the Access team's public keys (`/cdn-cgi/access/certs`), plus issuer, audience (app AUD tag) and expiry. Client-supplied `Cf-Access-*` headers are ignored.
- Unit tests: `npm test`. They cover valid, tampered-payload, spoofed-headers, wrong-audience and expired tokens. Three of these failed against the original demo code and pass now; good "trust but verify AI-written code" story (ties to topic 9).
- Verified live: a forged cookie and spoofed headers both get the signed-out view.

## Known gaps – FIX BEFORE DEMO

1. ~~`.plain.html` and `.md` bypass gating~~ — fixed: worker filters sections in `.plain.html` and returns 404 for `.md` of gated pages (tests in `workers/cdn/test/gating.test.js`).
2. **Origin is public (accepted for demo).** `main--devlive-26--shsteimer.aem.live/...` serves the ungated page. Fix: enable EDS site authentication on live and give the CDN worker a site token (`ORIGIN_AUTHENTICATION`). This is standard practice and worth mentioning on stage ("lock the origin, gate at the edge").
3. Sign-in returns the user to the page they clicked from. Confirm the round trip works on `/en/us/club/members` and the translated locales.

## Code map

| Piece | Path |
|---|---|
| CDN worker (proxy + gating) | `workers/cdn/index.js`, `workers/cdn/handlers/gating.js` |
| JWT verification + tests | `workers/cdn/handlers/auth-check.js`, `workers/cdn/test/auth-check.test.js` |
| Auth worker (login/logout/session) | `workers/auth/index.js` |
| Client auth helpers | `scripts/shared/auth-api.js` |
| Author preview toggle | `scripts/utils/gated-content.js`, `blocks/auth-toggle/` |
| Header Sign in/out | `blocks/header/header.js` (`initAuth`) |
| Config | `workers/*/wrangler.toml` (routes, origin, Access team domain + AUD) |
