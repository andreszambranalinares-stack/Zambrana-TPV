const CACHE_NAME = 'zambrana-v3.2';
const ASSETS = [
    './',
    './index.html',
    './landing.html',
    './css/styles.css',
    './js/app.js',
    './js/auth.js',
    './js/config.js',
    './js/crypto.js',
    './js/data.js',
    './js/device.js',
    './js/state.js',
    './js/storage.js',
    './js/tickets.js',
    './js/tour.js',
    './js/alergenos.js',
    './js/carta.js',
    './js/sync/provider.js',
    './js/sync/local-provider.js',
    './js/sync/supabase-provider.js',
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
    // Solo gestionamos GET del mismo origen. Las llamadas a Supabase (otro origen)
    // y los WebSocket de tiempo real pasan directos a la red, sin interferencia.
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

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
        }).catch(() => caches.match(event.request))
    );
});
