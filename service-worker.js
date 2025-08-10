// v9 — жёсткое версионирование, cache-first + SWR
const V = '9';
const CACHE = `tatar-pwa-v${V}`;
const ASSETS = [
  './',
  './index.html?v=9',
  './styles.css?v=9',
  './app.js?v=9',
  './data.js?v=9',
  './manifest.webmanifest?v=9',
  './tatartele.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  // cache-first + обновление в фоне
  e.respondWith((async()=>{
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req).then(res => { cache.put(req, res.clone()); return res; })
                                   .catch(()=>cached);
    return cached || fetchPromise;
  })());
});
