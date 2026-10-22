# Topic 1 – "If there's no server, where does my business logic go?"

Short answer: **EDS serves content; logic lives in APIs, at the edge, and in the browser.** "No server" means no page-rendering server. You still have a backend; it just doesn't render your pages.

## Slides

1. **Where did the server go?** Classic AEM: publish + dispatcher rendered pages *and* ran logic (Sling models, servlets, OSGi). EDS: rendering is the content pipeline; logic moves out. Diagram: browser ↔ edge (CDN) ↔ EDS origin + APIs.
2. **Three homes for logic.**
   - Browser: UI state, personalization, calling APIs.
   - Edge: auth and gating (Topic 8), redirects, geo, headers, API proxy.
   - APIs: data, secrets, transactions, systems of record. Cloudflare/Fastly/Akamai workers, App Builder (I/O Runtime), commerce, your existing services.
   - Rule of thumb: trust or secrets → API. Per-request page change → edge. Interaction → browser.
3. **Doing it right.**
   - The page stays static and cacheable; dynamic parts load from the block that needs them.
   - DA owns the words (labels, copy); the API owns the facts (stores, hours, stock).
   - `/api/*` on the same origin through the CDN: no CORS, no extra connection.
   - Cache API responses (short TTL, cache key without personal data).
   - API down? The page still works.
4. **Demo.**
5. **Close.** "There's still a server. It just doesn't render your pages."

## Talk points

- Business logic was never really about the page server. Pull it out and every piece gets simpler: pages are cacheable, the API scales on its own, and the edge does what used to need a load balancer config.
- Store data is not content. Authors shouldn't maintain opening hours in a document when a store system already knows them.
- The edge knows where the visitor is (`request.cf`: country, city, coordinates from the IP) without a prompt or a browser API. That's a business rule running at the edge.
- Backup if venue wifi geolocates badly: the API still accepts `?lat=37.33&lng=-121.89` (no UI).
- App Builder is the Adobe version of the same pattern; the worker here could be an I/O Runtime action behind the same `/api` path.

## Demo URLs

| What | URL |
|---|---|
| Store page (prod) | https://devlive.shsteimer.com/en/us/stores |
| Store page (preview) | https://main--devlive-26--shsteimer.aem.page/en/us/stores |
| API | https://devlive.shsteimer.com/api/stores |
| Block library | https://main--devlive-26--shsteimer.aem.page/library/blocks/store-finder |
| API worker | https://github.com/shsteimer/devlive-26/tree/main/workers/api |
| Block | https://github.com/shsteimer/devlive-26/blob/main/blocks/store-finder/store-finder.js |

## Demo flow

### 1. The page (~1 min)

1. Open `/en/us/stores` on prod. "Stores nearest to San Jose, United States": six stores, distance in miles, live open/closed status. "All stores" below, grouped by country.
2. Point out that the heading names the city. Nobody asked the visitor; the edge knows.

### 2. Where the logic lives (~3 min)

1. DevTools → Network: the page HTML is static and cached. One `GET /api/stores`, same origin.
2. Open the API response: `origin` (from `request.cf`), `nearest`, `stores`, each with `status`.
3. Show `workers/api/store-logic.js`: open-now in each store's time zone, distance, nearest six. Real business rules, unit tested.
4. Show `workers/api/stores.js`: in real life, this is the store system. The worker is the facade.

### 3. Caching (~1 min)

1. Reload a few times: `x-cache: MISS`, then `HIT`. The cache key is the coordinates rounded to ~10 km, never the visitor.
2. TTL is 60 s, so opening status stays fresh enough.

### 4. Failure (~30 s)

1. DevTools → block request URL `*/api/stores*`, reload. The rest of the page renders; the block shows "Store information is unavailable right now."

### 5. Authoring (~30 s)

In DA: the block is one cell of intro text. Labels ("Open · closes {time}") live in placeholders and translate like any other content.

## Prep checklist

| Task | Owner | Status |
|---|---|---|
| `workers/api` worker + tests | agent | done |
| `store-finder` block, library page, placeholders, `/en/stores` | agent | done |
| Deploy API worker (`npm run deploy:api`) | Sean | v1 done; redeploy for v2 |
| Push DA content (placeholders, stores, library page, redirects) | Sean or agent | |
| Roll out `/en/stores` → `/en/us`, `/en/gb`; translate → `/de` → `/de/de`, `/de/ch` | Sean | |
| Preview + publish `/en/stores`, `/en/placeholders.json`, `/redirects.json`, regional `stores` | Sean | |
| Remove stray `gb/`, `us/` folders (26, 910 files): unpublish, unpreview, delete in DA | Sean | |
| Test from venue wifi (edge geo) | Sean | |
| Slides | Sean | |
| Rehearse with VPN off (edge geo should show your real city) | Sean | |
