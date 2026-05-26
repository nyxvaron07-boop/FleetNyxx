const STATIC_CACHE = 'fleetnyx-v1.0-static';
const DYNAMIC_CACHE = 'fleetnyx-v1.0-dynamic';
const ALL_CACHES = [STATIC_CACHE, DYNAMIC_CACHE];

const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(STATIC_CACHE).then(cache =>
            Promise.allSettled(PRECACHE_ASSETS.map(url => 
                cache.add(url).catch(() => console.log('Failed to cache:', url))
            ))
        ).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    if (!e.request.url.startsWith('http')) return;
    
    e.respondWith(
        caches.match(e.request).then(cached => {
            const networkFetch = fetch(e.request).then(resp => {
                if (resp && resp.status === 200) {
                    const clone = resp.clone();
                    caches.open(DYNAMIC_CACHE).then(c => c.put(e.request, clone));
                }
                return resp;
            }).catch(() => null);
            return cached || networkFetch || offlinePage();
        })
    );
});

function offlinePage() {
    return new Response(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>FleetNyx - Offline</title><style>body{background:#030406;color:#00f0ff;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;}h1{font-size:2rem;text-shadow:0 0 20px #00f0ff;margin-bottom:1rem;}p{color:#4a5568;letter-spacing:.15em;font-size:.75rem;margin-bottom:1rem;}.footer{color:#1a202c;font-size:.6rem;margin-top:2rem;}</style></head><body><h1>FLEETNYX</h1><p>MODO OFFLINE — DATOS EN MEMORIA LOCAL</p><p>La aplicación funciona correctamente con los datos guardados localmente.</p><div class="footer">Creado y diseñado por Julian España © 2026</div></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
}
