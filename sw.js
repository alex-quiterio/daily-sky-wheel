// Offline support. The bundles in dist/ (the page, each tab, their shared chunks, the worker) are listed by the
// build in dist/files.json, so all of them are kept, and every tab opens offline once the page has been installed.
const VERSION = 'dev'; // replaced with the commit id on deploy
const SHELL = `shell-${VERSION}`;
const CDN = 'cdn-v2';
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
      await shell.addAll([...APP_FILES, ...built]);
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
