// Offline support. Bump VERSION when the list of app files changes.
const VERSION = 'v1';
const SHELL = `shell-${VERSION}`;
const CDN = 'cdn-v1';
const APP_FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'src/styles.css', 'src/stars.js', 'src/core.js', 'src/events.js', 'src/app.js',
  'assets/logo.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
];
const ASTRONOMY = 'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(APP_FILES);
    const cdn = await caches.open(CDN);
    try { await cdn.add(new Request(ASTRONOMY, { mode: 'cors' })); } catch (e) { /* fetched on first use instead */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, CDN]);
    for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Own files: network first so updates show up straight away, cache when offline.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(SHELL)).put(req, res.clone());
        return res;
      } catch (e) {
        const hit = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
        return hit || caches.match('index.html');
      }
    })());
    return;
  }

  // Pinned library and fonts never change at the same URL: cache first.
  if (/^(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') (await caches.open(CDN)).put(req, res.clone());
      return res;
    })());
  }
});
