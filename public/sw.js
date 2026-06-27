// History Optional — minimal service worker
// Purpose: PWA installability + light caching of truly static assets.
// Deliberately NOT cache-first for pages/API — this app has live AI eval,
// auth state, and subscription data that must never be served stale.

const CACHE_NAME = 'ho-static-v1';
const STATIC_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests for same-origin static assets we explicitly listed.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isStaticAsset = STATIC_ASSETS.some((path) => url.pathname === path);

  if (!isStaticAsset) {
    // Everything else (pages, API, fonts, app data) — let the network handle it
    // normally. No interception, no stale-cache risk.
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
