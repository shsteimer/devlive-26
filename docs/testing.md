# Testing

Write a test only when a wrong answer is plausible and costly to miss. Coverage is not the goal.

## Layers

| Layer | Command | When | Gate |
|---|---|---|---|
| Lint | `npm run lint` | every commit (husky), every push (CI) | yes |
| Unit | `npm test` | every push (CI) | yes |
| SonarQube | CI | every push | yes |
| Browser check | agent/human, `aem up` | before a PR | no |
| Block E2E | `npm run test:e2e` | before a PR | no |
| PageSpeed | AEM Code Sync bot on the PR | every PR | yes |
| Regression | `npm run test:e2e:regression` (set `E2E_BASE_URL` for preview/live) | as needed | no |
| `@analytics` | `npm run test:e2e:analytics` | as needed (after Topic 5) | no |

## Unit (`test/**/*.test.js`)

- `node:test` + `jsdom`. Call `setupDom()` from `test/support/setup-dom.js`, then `await import()` the module.
- Pure logic with a right/wrong answer: parsing, URL rewriting, index math.
- Malformed or missing authored input belongs here, not in E2E.
- Inline fixtures (`innerHTML`); no fixture files.

## Browser check (before a PR)

- Load the changed page at 375, 900 and 1280 px.
- Tab through it: visible focus, logical order, nothing trapped.
- Check console errors, heading order and image `alt`.

## Block E2E (`test/e2e/blocks/{block}/{block}.spec.js`)

Content is the DA block library: `/library/blocks/{block}`, one page per block. These pages double as author docs, are never published, and render from the local `content/` clone.

E2E checks:
- Accessibility: roles, names, ARIA state, keyboard and focus.
- Behavior: what happens when a user acts.
- Analytics events firing (`@analytics`, once martech is wired up).

E2E does not check:
- DOM or class structure. Never select by a class that `decorate()` injects. Wait on `.{block}.block[data-block-status="loaded"]`.
- Visual layout or styling: no computed CSS, no bounding boxes.
- Authored or placeholder text. Read labels at runtime and never hardcode them.

Specs cover the happy path only. Skip a spec when `decorate()` only rearranges static DOM.

## Regression specs

A few page-level specs (`test/e2e/regression/`, tagged `@regression`) run against real content, for example `E2E_BASE_URL=https://main--devlive-26--shsteimer.aem.page npm run test:e2e:regression`. They aren't tied to a PR.
