import { set } from './idb-keyval.js';

const CACHE_NAME = 'gemini-share-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './idb-keyval.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

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

    // Handle Share Target POST
    if (event.request.method === 'POST' && url.pathname.endsWith('/share-target/')) {
        event.respondWith(
            (async () => {
                try {
                    const formData = await event.request.formData();
                    const imageFile = formData.get('image');

                    if (imageFile) {
                        // Store the file in IndexedDB
                        await set('shared-image', imageFile);
                        console.log('Image stored in IDB');
                    }

                    // Redirect to the app with a query param
                    return Response.redirect('./?share=true', 303);
                } catch (err) {
                    console.error('Share target error:', err);
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
