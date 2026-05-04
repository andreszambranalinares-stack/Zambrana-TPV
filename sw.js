const CACHE_NAME = 'zambrana-v2.5';
const ASSETS = [
    './',
    './index.html',
    './landing.html',
    './css/styles.css',
    './js/app.js',
    './js/auth.js',
    './js/data.js',
    './js/device.js',
    './js/state.js',
    './js/storage.js',
    './js/tickets.js',
    './js/tour.js',
    './js/alergenos.js',
    './js/ui/home.js',
    './js/ui/camarero.js',
    './js/ui/mobile_camarero.js',
    './js/ui/cocinero.js',
    './js/ui/barra.js',
    './js/ui/admin.js',
    './js/ui/desktop.js',
    './js/ui/sidebar.js',
    './js/ui/common.js',
    './js/ui/devices_admin.js',
    './manifest.json',
    './favicon.png',
    './logo.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request).then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
            return networkResponse;
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});
