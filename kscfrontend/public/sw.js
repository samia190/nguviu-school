// Service Worker for caching and offline functionality
const CACHE_NAME = 'kangaru girls-v2';
const RUNTIME_CACHE = 'kangaru girls-runtime-v2';

// Only cache essential static assets that actually exist in build
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching precache assets');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200) {
          return response;
        }

        // Don't cache responses where content-type doesn't match the request.
        // This prevents caching HTML error pages served for missing images/assets.
        const contentType = response.headers.get('content-type') || '';
        const requestPath = url.pathname.toLowerCase();

        const isAssetRequest = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|pdf|css|js|ico|woff2?|ttf|eot)(\?|$)/i.test(requestPath)
          || requestPath.startsWith('/images/')
          || requestPath.startsWith('/uploads/')
          || requestPath.startsWith('/downloads/');

        // If the request looks like an asset but got HTML back, don't cache it
        if (isAssetRequest && contentType.includes('text/html')) {
          return response;
        }

        // Clone and cache the response
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});
