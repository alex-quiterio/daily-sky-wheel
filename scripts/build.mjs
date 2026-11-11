// Bundle src/ into dist/: the page (app.js and app.css), one bundle per tab (view-<name>.js and .css, loaded the
// first time the tab opens), the chunks they share, and the worker. Everything lands in dist/ itself, flat,
// because the page finds the tab styles and the worker next to its own bundles.
//   node scripts/build.mjs           minified build
//   node scripts/build.mjs --serve   rebuild on every save and serve on http://localhost:8000
import * as esbuild from 'esbuild';
import { readdirSync, writeFileSync } from 'node:fs';

const serve = process.argv.includes('--serve');
const tabs = readdirSync('src/views', { withFileTypes: true }).filter((d) => d.isDirectory());

const common = { bundle: true, target: 'es2022', sourcemap: true, minify: !serve, outdir: 'dist', logLevel: 'info' };

// the page and its tabs: ES modules, with the code they share split into chunks
const page = {
  ...common,
  entryPoints: [
    { in: 'src/app.tsx', out: 'app' },
    ...tabs.map((d) => ({ in: `src/views/${d.name}/index.tsx`, out: `view-${d.name}` })),
  ],
  format: 'esm',
  splitting: true,
  chunkNames: 'chunk-[hash]',
  metafile: true,
  plugins: [
    {
      // the files the service worker keeps for offline use
      name: 'file-list',
      setup(build) {
        build.onEnd((result) => {
          if (!result.metafile) return;
          const files = Object.keys(result.metafile.outputs).filter((f) => !f.endsWith('.map'));
          writeFileSync('dist/files.json', JSON.stringify([...files, 'dist/worker.js'].sort(), null, 1) + '\n');
        });
      },
    },
  ],
};

// the worker: a classic script of its own, since module workers are not everywhere yet
const worker = { ...common, entryPoints: ['src/worker.ts'], format: 'iife' };

if (serve) {
  const [pageCtx, workerCtx] = await Promise.all([esbuild.context(page), esbuild.context(worker)]);
  await Promise.all([pageCtx.watch(), workerCtx.watch()]);
  await pageCtx.serve({ servedir: '.', port: 8000 });
} else {
  await Promise.all([esbuild.build(page), esbuild.build(worker)]);
}
