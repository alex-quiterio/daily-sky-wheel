// Offline support. The bundles in dist/ (the page, each tab, their shared chunks, the worker) are listed by the
// build in dist/files.json, so all of them are kept, and every tab opens offline once the page has been installed.
const VERSION = 'dev'; // replaced with the commit id on deploy
const SHELL = `shell-${VERSION}`;
const CDN = 'cdn-v1';
const APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/logo.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      const built = await (await fetch('dist/files.json', { cache: 'no-cache' })).json();
      await shell.addAll([...APP_FILES, ...built]);
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

  // Own files: network first so updates show up straight away, cache when offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          // no-cache: always revalidate with the server, so a new deploy never mixes old and new files
          const res = await fetch(req, { cache: 'no-cache' });
          if (res.ok) (await caches.open(SHELL)).put(req, res.clone());
          return res;
        } catch (e) {
          const hit = await caches.match(req, { ignoreSearch: true });
          return hit || caches.match('index.html');
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
