// Service Worker for caching and offline functionality
// Bump version string on every deployment to force cache invalidation
const CACHE_NAME = 'kangaru-girls-v3';
const RUNTIME_CACHE = 'kangaru-girls-runtime-v3';

// Install event - skip waiting immediately, no HTML precache
// HTML must always come from the network so stale index.html never serves old JS hashes
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - delete ALL previous caches, then claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Navigation requests (HTML pages) — ALWAYS network-first, never serve from cache.
  // This prevents stale index.html with old hashed JS filenames causing blank pages
  // after a new deployment.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Offline fallback: serve cached index.html if available
        return caches.match('/index.html');
      })
    );
    return;
  }

  // API requests — network first, runtime cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets (hashed filenames from Vite build) — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Only cache successful, same-origin, non-HTML asset responses
        if (!response || response.status !== 200) {
          return response;
        }

        const contentType = response.headers.get('content-type') || '';
        const requestPath = url.pathname.toLowerCase();

        const isStaticAsset = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|pdf|css|js|ico|woff2?|ttf|eot)(\?|$)/i.test(requestPath)
          || requestPath.startsWith('/assets/')
          || requestPath.startsWith('/images/')
          || requestPath.startsWith('/uploads/')
          || requestPath.startsWith('/downloads/');

        // Don't cache if the server returned HTML for an asset request (CDN error page)
        if (isStaticAsset && contentType.includes('text/html')) {
          return response;
        }

        if (isStaticAsset) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      }).catch((error) => {
        console.warn('[SW] Fetch failed for:', request.url, error);
        return caches.match(request) || Promise.reject(error);
      });
    })
  );
});
