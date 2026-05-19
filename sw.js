const CACHE_NAME = 'omtoro-pdf-v8';

const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Langsung usir Service Worker versi lama
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Om Toro PWA: Mengunduh file baru (Bypass HTTP Cache)...');
            // Jurus {cache: 'reload'} agar browser dipaksa menarik file asli dari server GitHub
            return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Om Toro PWA: Menghancurkan brankas memori lama...', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    // JURUS NETWORK-FIRST: Selalu cek internet dulu!
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Jika sukses mengambil dari internet, simpan versi terbarunya ke brankas
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Jika tablet sedang OFFLINE, baru gunakan file dari brankas memori
                return caches.match(event.request);
            })
    );
});
