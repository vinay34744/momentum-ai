/**
 * Momentum AI — Service Worker (Phase 0 PWA Foundation)
 * Offline static asset caching
 */

const CACHE_NAME = 'momentum-ai-v1.2.0';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './privacy.html',
    './terms.html',
    './assets/icon-192.png',
    './assets/icon-512.png'
];

// Install Event: Cache Static Assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install Event. Pre-caching static app shell assets.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.warn('[ServiceWorker] Pre-cache warning:', err);
            })
    );
});

// Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate Event.');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[ServiceWorker] Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Cache First, Network Fallback Strategy
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((networkResponse) => {
                        // Check valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clone and cache network response
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    });
            })
            .catch(() => {
                // Fallback for offline fetch errors
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});
