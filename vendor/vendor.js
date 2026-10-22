#!/usr/bin/env node
/**
 * Bundles runtime dependencies into single-file browser ESM modules under vendor/.
 * Output is committed; the site never runs a build. Blocks import vendor files directly,
 * so each library only loads on pages that use the block.
 *
 * Runs on `npm install` (postinstall) and via `npm run vendor`.
 *
 * To add a dependency:
 *   1. `npm install <pkg>` (pins it in `dependencies`)
 *   2. Add an entry to DEPS below
 *
 * Config shape:
 *   entry  - npm package or wrapper file under vendor/ (wrappers keep shared runtimes,
 *            e.g. react + react-dom, in one bundle). `.css` entries bundle stylesheets.
 *   out    - output file under vendor/
 */

import { build } from 'esbuild';
import { join } from 'node:path';

const DEPS = [
  { entry: './vendor/react/index.js', out: 'react/react.js' },
  { entry: './vendor/swiper/index.js', out: 'swiper/swiper.js' },
  { entry: './vendor/swiper/index.css', out: 'swiper/swiper.css' },
];

const root = new URL('..', import.meta.url).pathname;

await Promise.all(DEPS.map(async ({ entry, out }) => {
  await build({
    absWorkingDir: root,
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    legalComments: 'none',
    define: { 'process.env.NODE_ENV': '"production"' },
    outfile: join(root, 'vendor', out),
    logLevel: 'warning',
  });
  console.log(`vendored: ${entry} → vendor/${out}`);
}));
