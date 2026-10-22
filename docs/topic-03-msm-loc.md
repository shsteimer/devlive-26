# Topic 3 – "Our site is in 120 countries, 4 regions and 75 languages, all with unique content. How do we manage all of that?"

Short answer: **Two tools for two problems.** Loc shares content across *languages and regions*. MSM shares content across *sites and brands*. Use either one, or both. Experience Workspace (DA) does both, at page level.

## Demo URLs

| What | URL |
|---|---|
| Veloxa (base) preview | https://main--devlive-26--shsteimer.aem.page/en/ |
| Veloxa CH product page | https://main--devlive-26--shsteimer.aem.page/de/ch/products/summit-shell |
| Trailcraft (satellite) preview | https://main--devlive-satelite--shsteimer.aem.page/en/ |
| Trailcraft inherited product page | https://main--devlive-satelite--shsteimer.aem.page/en/products/summit-shell |
| DA: Veloxa content | https://da.live/#/shsteimer/devlive-26 |
| DA: Trailcraft content | https://da.live/#/shsteimer/devlive-satelite |
| DA: MSM config | https://da.live/config#/shsteimer/ (msm tab) |
| DA: translation config | https://da.live/#/shsteimer/devlive-26/.da (translate) |


## Act 1 – Loc only (Veloxa: one brand, many markets)

1. **Structure.** In DA, show `/en`, `/de`, `/en/us`, `/en/gb`, `/de/de` and `/de/ch`.
   - Language first, region second. Regions exist only where content differs.
   - 75 languages is about 75 translations, not 120 × 75.
2. **Regional edit.** In `/de/ch/products/summit-shell`, change the price to `CHF 279`. Preview.
3. **Source change.** In `/en/products/summit-shell`, change the description. Preview.
4. **Translate and roll out.** Create a Loc project for that page: `/en` → `/de` (machine translation), then roll out `/de` → `/de/de`, `/de/ch` with **merge**.
   - Do-not-translate rules keep "Summit Shell Jacket" in English.
   - `/de/ch` gets the new description **and keeps CHF 279**.
5. **Placeholders.** UI text lives in the language sheet (`/en/placeholders`). `/en/gb/placeholders` holds only the UK difference ("Add to basket"). Show the product page in `/en/us` vs `/en/gb`.

Point: one source, translations and regional edits that survive updates.

## Act 2 – MSM (Veloxa → Trailcraft: many brands, one base)

1. **Config.** The DA config msm tab has one row: base `devlive-26`, satellite `devlive-satelite`. Trailcraft runs on the same code (repoless).
2. **Satellite contents.** Trailcraft in DA holds only what's unique: `metadata`, `en/index`, `en/nav`, `en/footer`, `en/trail-guides`. Everything else is inherited.
3. **The site.** Open the Trailcraft home page: own theme, own nav, own home.
   - Click through to a product page and to help. Both are inherited from Veloxa and already in Trailcraft's theme.
   - The Act 1 description change is already there, with no copy step.
4. **Break inheritance live.** Create `/en/products/summit-shell` in Trailcraft with brand-specific copy. Preview. That page is now local and stops following Veloxa; all other pages still inherit.
5. **Theme code.** One metadata row (`theme: trailcraft`) and `styles/themes/trailcraft.css` (about 10 lines of brand tokens). Blocks only use tokens, so nothing else changes. Pattern: https://www.aem.live/developer/multi-brand-sites

Point: inheritance is page-level. A page is either inherited or local.

## Act 3 – Both

1. Open Trailcraft `/de/`. Its home, nav and footer are Trailcraft's own pages, translated with Loc **inside the satellite**. Loc only runs on local pages.
2. Click a product: `/de/products/...` is inherited from Veloxa's `/de`, which Veloxa translated once.
3. Rule: translate where the content lives. Base pages are translated in the base; satellite overrides are translated in the satellite.

## Closing slide – when to use what

| Need | Use |
|---|---|
| One brand, many languages and markets | Loc (language folders + regional rollout) |
| Many brands or sites sharing most content | MSM (base → satellites, page-level overrides) |
| Many brands, each in many languages | Both: translate in the base, override and translate locally in satellites |

At scale (slide only): per-language indexes and sitemaps with hreflang; bulk metadata per site; translation config and glossary as sheets; merge rollouts; DA and admin APIs for automation.

## Prep checklist

| Task | Owner | Status |
|---|---|---|
| Trim locales to EN/DE (`locales.json`, translate config) | agent | pushed to DA |
| Theme loader + `styles/themes/trailcraft.css` | agent | done (`48972ed`, `936126b`) |
| Placeholders: region overrides language | agent | done (`8a576a9`) |
| Create `devlive-satelite` repoless site + msm config row | Sean | done |
| Trailcraft content: metadata, `en/index`, `en/nav`, `en/footer`, `en/trail-guides` | agent | done, live |
| Translate Trailcraft overrides to `/de` (Loc in satellite) | Sean | done, live |
| Trim `/en/gb/placeholders` to the UK difference | agent | done, live |
| Reset demo pages (CH price, summit-shell description) before the talk | Sean | |
