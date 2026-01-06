// Atlas AI Service Worker
// Cache-first strategy for static assets, stale-while-revalidate for HTML

const CACHE_NAME = 'atlas-ai-v1';
const RUNTIME_CACHE = 'atlas-ai-runtime';

// Static assets to cache immediately
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/logo.svg',
    // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                    })
                    .map((cacheName) => {
                        return caches.delete(cacheName);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests
    if (request.method !== 'GET') return;

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        // For CDNs (fonts, Three.js), use cache-first
        if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
            event.respondWith(
                caches.open(RUNTIME_CACHE).then((cache) => {
                    return cache.match(request).then((response) => {
                        return response || fetch(request).then((response) => {
                            // Clone response before caching
                            const responseClone = response.clone();
                            cache.put(request, responseClone);
                            return response;
                        });
                    });
                })
            );
        }
        return;
    }

    // Cache-first for static assets (images, fonts, CSS, JS)
    if (request.destination === 'image' ||
        request.destination === 'font' ||
        request.destination === 'style' ||
        request.destination === 'script') {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((response) => {
                    return response || fetch(request).then((response) => {
                        const responseClone = response.clone();
                        cache.put(request, responseClone);
                        return response;
                    });
                });
            })
        );
        return;
    }

    // Stale-while-revalidate for HTML
    if (request.mode === 'navigate') {
        event.respondWith(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.match(request).then((response) => {
                    // Use cached version immediately
                    const fetchPromise = fetch(request).then((networkResponse) => {
                        // Update cache with fresh version
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });

                    // Return cached version or wait for network
                    return response || fetchPromise;
                });
            })
        );
        return;
    }

    // Network-first for API calls (Formspree, Cal.com)
    event.respondWith(
        fetch(request).catch(() => {
            return caches.match(request);
        })
    );
});
