# DevLive 26 – "Yes, you can do that in EDS"

Top 10 countdown of objections we hear most, each answered with a real EDS solution.
10–6: short (slides, stories, maybe a quick demo). 5–1: longer, more explanation + demo.

| # | Question | Format / notes |
|---|----------|----------------|
| 10 | My AEM Cloud Service program has 6 environments. What's the right way to map those environments to Edge Delivery? | Diagrams + explanation, likely no demo |
| 9 | Can I really expect AI to write all my code? How do I review that and who maintains it in 6 months? | Short |
| 8 | Our site is behind a login or has gated content. Is Edge Delivery even an option for that? | Gated content, CDN-based content auth |
| 7 | Without a build pipeline, how do we ensure we don't ship broken code to production? | Testing approach/skills from `~/dev/projects/aemeds-toyota-racing`; Sean has a diagram |
| 6 | We have 75+ components with custom dialogs, integrations, etc. Do I need to rebuild all of that? | Short |
| 5 | Our Lighthouse score was 100 until we added all our analytics and mar-tech tags. I was promised great performance, what now? | Long; martech plugin |
| 4 | Why are we being told to author content in documents? | Long |
| 3 | Our site is in 120 countries, 4 regions, and 75 languages, all with unique content. How do we manage all of that? | Long; locale folders, DA translation config, repoless sub-brand sites |
| 2 | No React? What if I need a carousel? And what about our design system? | Long |
| 1 | If there's no server, where does my business logic go? | Long |

## Demo site

Veloxa – multinational sporting goods brand (Copenhagen, 1984). Sub-brands: Trailcraft (outdoor), Fieldline (team sports) – candidates for repoless sites.

- Code: https://github.com/shsteimer/devlive-26
- Content: DA `shsteimer/devlive-26`, language folders `/en` (source), `/de`, `/fr`, `/es`, `/ja`
