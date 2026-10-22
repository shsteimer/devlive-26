# Topic 2 – "No React? What if I need a carousel? And what about our design system?"

Short answer: **EDS is the web platform; bring what you need, the right way.** Vanilla JS and CSS cover most needs, a carousel included. When a library earns its place, vendor it and load it only in the block that uses it, after LCP. A design system becomes tokens and blocks.

## Talk points

- EDS is built on the web platform; you can bring any framework.
- If you do, don't throw away what the platform gives you: no single giant JS/CSS bundle shipped to every page.
- We recommend vanilla JS and CSS because modern browsers make it possible and, for most sites, ideal. You don't need a framework for a carousel.
- Third-party libraries are fine, sparingly, and never before LCP. If your hero is a carousel, don't make it a library carousel.
- JS CDNs vs vendoring: prefer vendoring (same origin, pinned, reviewable, no extra connection or CSP entry).

## Demo URLs

| What | URL |
|---|---|
| Vanilla carousel | https://main--devlive-26--shsteimer.aem.page/library/blocks/carousel |
| Swiper carousel | https://main--devlive-26--shsteimer.aem.page/library/blocks/carousel-swiper |
| Size guide (React block) | https://main--devlive-26--shsteimer.aem.page/en/size-guide |
| Home page (no React) | https://main--devlive-26--shsteimer.aem.page/en/ |
| Vendor script | https://github.com/shsteimer/devlive-26/blob/main/vendor/vendor.js |
| Size finder block | https://github.com/shsteimer/devlive-26/blob/main/blocks/size-finder/size-finder.js |
| Pattern reference | https://github.com/adobe/helix-tools-website (vendor/vendor.js) |

## Demo flow

### 1. "You don't need a framework for a carousel" (~2 min)

1. Open the vanilla carousel. Click next a few times, then wrap from the last slide to the first. The wrap is a View Transition, not a scroll back through every slide.
2. DevTools → Network, filter `carousel`: `carousel.js` 5.5 KB, `carousel.css` 4.5 KB (uncompressed). Nothing else.
3. Mention what's in it: CSS scroll-snap, `inert` on hidden slides, View Transitions with types, reduced-motion support. All native.

### 2. "And with a library?" (~2 min)

1. Open the Swiper carousel: same content, same look.
2. Network: `carousel-swiper.js` 1.9 KB **plus** `vendor/swiper/swiper.js` 87.7 KB and `swiper.css` 10.4 KB.
3. Point: about 17× the JavaScript for the same carousel. It's still only on this page, because the block imports it.
4. Aside if asked: Swiper ignores arrow keys during its slide animation; the vanilla one doesn't.

### 3. "Bring React, the right way" (~3 min)

1. Open the size guide. Enter 26.2 cm and switch the fit; the size updates live.
2. Network: `vendor/react/react.js` (223 KB, 70 KB gzipped) loads only here, in the lazy phase, because the block sits below the first section.
3. Open the home page with Network open: no React requested at all.
4. Show `size-finder.js`: `import { html, useState, createRoot } from '../../vendor/react/react.js'`. htm gives JSX-like templates with no build step.
5. Show the authoring side: intro text plus a link to the size chart sheet in DA; labels come from placeholders. The React app is still author-driven.

### 4. Vendoring (~2 min)

1. `package.json` pins `react`, `react-dom`, `htm`, `swiper`.
2. `vendor/vendor.js`: a list of entries; esbuild bundles each into one ES module under `vendor/`. It runs on `npm install`.
3. Output is committed. The site still has no build step.
4. Dependabot opens update PRs with cooldowns (3/7/30 days). CI re-runs vendoring and commits the result to the bot's branch, and fails any other push whose `vendor/` is out of sync.
5. CDN alternative: `import ... from 'https://esm.sh/react'` works, but it adds a third-party origin, depends on their uptime, and needs a CSP entry.

### 5. "And our design system?" (~30 s)

Point back to Topic 3: tokens are CSS custom properties (`--color-brand`, `--color-surface`, `--radius`), components are blocks, and a brand is a theme file. Trailcraft is 10 lines of CSS.

## Prep checklist

| Task | Owner | Status |
|---|---|---|
| Vendoring (`vendor/vendor.js`, CI sync, Dependabot) | agent | done |
| Size finder block, size guide page, size chart sheet | agent | done, live |
| Vanilla carousel upgrades | agent | done, live |
| Swiper carousel block + library page | agent | done, preview |
| PSI run on `/en/size-guide` to show it stays at 100 | Sean | |
| Clear DevTools cache and enable "Disable cache" before demoing Network sizes | Sean | |
