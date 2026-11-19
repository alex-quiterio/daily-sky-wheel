// Offline support. The bundles in dist/ (the page, each tab, their shared chunks, the worker) are listed by the
// build in dist/files.json, so all of them are kept, and every tab opens offline once the page has been installed.
const VERSION = 'dev'; // replaced with the commit id on deploy
const SHELL = `shell-${VERSION}`;
const CDN = 'cdn-v2';
let deadUntil = 0; // after one request has run out of patience, the next ones do not wait again for a while
const SLOW_MS = 3000; // how long to wait for the network before using the kept copy
const APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/logo.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
];

// Keep every web font the page asks for: the stylesheets linked from index.html, and the font files they point to.
// Without this a font is only kept after it has been drawn once online, so the scripts of tabs not yet opened
// (Chinese, Hebrew, Devanagari, Arabic) would fall back to system fonts offline.
async function keepFonts() {
  try {
    const cdn = await caches.open(CDN);
    const html = await (await fetch('index.html', { cache: 'no-cache' })).text();
    const sheets = [...html.matchAll(/href="(https:\/\/fonts\.googleapis\.com\/[^"]+)"/g)].map((m) =>
      m[1].replaceAll('&amp;', '&'),
    );
    for (const sheet of sheets) {
      try {
        const res = await fetch(sheet);
        if (!res.ok) continue;
        await cdn.put(sheet, res.clone());
        const files = new Set(
          [...(await res.text()).matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]),
        );
        await Promise.all([...files].map((f) => cdn.add(f).catch(() => {})));
      } catch (e) {
        /* this one stays online-only */
      }
    }
  } catch (e) {
    /* fonts stay online-only */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      const built = await (await fetch('dist/files.json', { cache: 'no-cache' })).json();
      // One file that fails to download must not lose the rest (addAll is all or nothing). Only the files the page
      // cannot start without have to arrive; any other is kept the first time it is asked for.
      const needed = new Set(['./', 'index.html', 'dist/app.js', 'dist/app.css']);
      const files = [...new Set([...APP_FILES, ...built])];
      const results = await Promise.allSettled(files.map((f) => shell.add(f)));
      const missing = files.filter((f, i) => results[i].status === 'rejected' && needed.has(f));
      if (missing.length) throw new Error(`could not keep ${missing.join(', ')}`);
      await keepFonts(); // best effort: a failure here must not stop the app from installing
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, CDN]);
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Own files: network first so updates show up straight away, the kept copy when offline. A connection that is
  // there but dead (wifi without internet, one bar of signal) never fails, it just hangs, so after a few seconds
  // the kept copy is used while the request carries on and refreshes the cache for next time.
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const kept = () => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'));
        // no-cache: always revalidate with the server, so a new deploy never mixes old and new files
        const network = fetch(req, { cache: 'no-cache' }).then(async (res) => {
          deadUntil = 0;
          if (res.ok) await (await caches.open(SHELL)).put(req, res.clone());
          return res;
        });
        const patience = new Promise((resolve) =>
          self.setTimeout(
            async () => {
              const hit = await kept();
              if (hit) deadUntil = Date.now() + 30000;
              resolve(hit);
            },
            Date.now() < deadUntil ? 0 : SLOW_MS,
          ),
        );
        try {
          return (await Promise.race([network, patience])) || (await network);
        } catch (e) {
          return (await kept()) || self.Response.error();
        }
      })(),
    );
    return;
  }

  // Fonts never change at the same URL: cache first.
  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') (await caches.open(CDN)).put(req, res.clone());
        return res;
      })(),
    );
  }
});
