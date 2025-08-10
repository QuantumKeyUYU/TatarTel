// service-worker.js
// Версионирование кэша — меняй V при каждом деплое
const V = '8';
const CACHE = `tatar-pwa-v${V}`;
const ASSETS = [
  './',
  './index.html?v=8',
  './styles.css?v=8',
  './app.js?v=8',
  './data.js?v=8',
  './manifest.webmanifest?v=8'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // network-first для data.js, чтобы обновления прилетали сразу
  if (url.pathname.endsWith('data.js')) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request);
        const c = await caches.open(CACHE);
        c.put(e.request, fresh.clone());
        return fresh;
      } catch {
        const c = await caches.open(CACHE);
        return (await c.match(e.request)) || new Response('export const DATA={phrases:[],proverbs:[],facts:[]};', {headers:{'Content-Type':'application/javascript'}});
      }
    })());
    return;
  }

  // cache-first для остального с подзагрузкой обновлений
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const cached = await c.match(e.request);
    const fetchPromise = fetch(e.request).then(res => {
      c.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
