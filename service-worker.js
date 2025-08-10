// v5 — аккуратный SW: precache + network-first для data.js
const CACHE = 'tatar-pwa-v5';
const CORE = [
  './',
  './index.html',
  './styles.css?v=5',
  './app.js?v=5',
  './data.js?v=5',
  './manifest.webmanifest'
];

self.addEventListener('install', e=>{
  e.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e=>{
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);

  // network-first для динамики (data.js), чтобы обновления прилетали
  if (url.pathname.endsWith('data.js')) {
    e.respondWith((async()=>{
      try{
        const fresh = await fetch(e.request);
        const cache = await caches.open(CACHE);
        cache.put(e.request, fresh.clone());
        return fresh;
      }catch{
        const cache = await caches.open(CACHE);
        return (await cache.match(e.request)) || new Response('export const DATA={phrases:[],proverbs:[],facts:[]};');
      }
    })());
    return;
  }

  // остальные — stale-while-revalidate
  e.respondWith((async()=>{
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request);
    const network = fetch(e.request).then(res => {
      cache.put(e.request, res.clone());
      return res;
    }).catch(()=>cached);
    return cached || network;
  })());
});
