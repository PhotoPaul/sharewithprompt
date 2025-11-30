const CACHE_NAME = 'gemini-share-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// --- Inlined IDB Helper ---
const dbName = 'gemini-share-store';
const storeName = 'shared-files';

function getDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        request.onsuccess = () => resolve(request.result);
    });
}

async function set(key, val) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(storeName).put(val, key);
    });
}
// --------------------------

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Intercept Share Target POST
    // We match any path ending in _share-target to be safe
    if (event.request.method === 'POST' && url.pathname.includes('_share-target')) {
        event.respondWith(
            (async () => {
                try {
                    const formData = await event.request.formData();
                    const imageFile = formData.get('image');

                    if (imageFile) {
                        await set('shared-image', imageFile);
                    }

                    // Redirect to the app with a query param
                    // Use 303 See Other to convert POST to GET
                    return Response.redirect('./?share=true', 303);
                } catch (err) {
                    console.error('Share target error:', err);
                    // Fallback: Redirect to home with error
                    return Response.redirect('./?error=share_failed', 303);
                }
            })()
        );
        return;
    }

    // Standard Cache-First Strategy
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
