// ChronoBlast Service Worker — v9
// Served as a real .js file on GitHub Pages so SW registration works on HTTPS.

const CACHE_NAME = 'chronoblast-v9';
const SHELL = [
  './',
  './ChronoBlast_V9.html',
  './sw.js'
];

// Install — cache the app shell immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate — wipe any old caches from previous versions
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — cache-first for shell assets, network-first for everything else
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Skip cross-origin requests (Google Fonts, etc.)
  if (url.origin !== location.origin) return;

  // Cache-first for our shell files
  const isShell = SHELL.some(s => url.pathname.endsWith(s.replace('./', '/')))
    || url.pathname === '/'
    || url.pathname.endsWith('/CHRONOBLAST/')
    || url.pathname.endsWith('ChronoBlast_V9.html');

  if (isShell) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) {
          // Serve cache immediately, update in background
          fetch(e.request).then(res => {
            if (res && res.status === 200) {
              caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
            }
          }).catch(() => {});
          return cached;
        }
        // Not cached yet — fetch and cache
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => caches.match('./ChronoBlast_V9.html'));
      })
    );
  }
});

// Message handler — allows the page to trigger SW updates
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
