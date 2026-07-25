// Service worker for the OMR Scanner PWA.
// Caches the app shell + the OpenCV.js CDN bundle on install, so the app
// keeps working fully offline after the first successful load — no wifi
// needed in the classroom once it's been opened once on a connected device.
//
// Bump CACHE_NAME whenever index.html/manifest/icons change, so returning
// users get the new version instead of a stale cached one.
const CACHE_NAME = 'omr-scanner-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.1/dist/opencv.js'
];

// IMPORTANT: cache.addAll() is all-or-nothing — if even one URL in the list
// fails to fetch (e.g. the cross-origin CDN file, which is the most fragile
// entry here), the entire install step rejects and the service worker never
// activates. On Android Chrome, a service worker that never activates is the
// most common reason "Add to Home Screen" only creates a plain bookmark
// shortcut instead of offering a real "Install app" — installability
// requires an active service worker with a fetch handler. Caching each
// resource independently means one flaky/CORS-blocked resource only costs
// that one resource's offline availability, not the whole PWA install.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('SW: failed to cache', url, err);
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first: serve from cache immediately if available (fast, works offline),
// and opportunistically refresh the cache from the network in the background.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline and not cached: nothing more we can do

      return cached || networkFetch;
    })
  );
});
