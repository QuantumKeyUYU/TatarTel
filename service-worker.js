// Жёсткое версионирование кэша: меняй V при каждом деплое
const V = '7';
const CACHE = `tatar-pwa-v${V}`;
const ASSETS = [
  './',
  './index.html?v=7',
  './styles.css?v=7',
  './app.js?v=7',
  './data.js?v=7',
  './manifest.webmanifest?v=7'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  // кэш-первыми для статических файлов
  if (request.method === 'GET' && (request.url.includes(self.location.origin))) {
    e.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
