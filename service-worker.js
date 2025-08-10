// service-worker.js (v9)
const V = '9';
const CACHE = `tatar-pwa-v${V}`;
const CORE = [
  './',
  './index.html?v=9',
  './styles.css?v=9',
  './app.js?v=9',
  './data.js?v=9',
  './tatartele.png',
  './manifest.webmanifest?v=9',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

// data.js — network first (чтобы обновления прилетали)
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('/data.js') || url.pathname.endsWith('data.js')) {
    e.respondWith((async()=>{
      try{
        const fresh = await fetch(e.request);
        const cache = await caches.open(CACHE);
        cache.put(e.request, fresh.clone());
        return fresh;
      }catch{
        const cache = await caches.open(CACHE);
        return (await cache.match(e.request)) || new Response('export const DATA={phrases:[],proverbs:[],facts:[]};',{headers:{'Content-Type':'application/javascript'}});
      }
    })());
    return;
  }

  // остальное — cache first + SWR
  if (e.request.method==='GET' && url.origin === self.location.origin) {
    e.respondWith((async()=>{
      const cache = await caches.open(CACHE);
      const hit = await cache.match(e.request);
      const fetchPromise = fetch(e.request).then(res => { cache.put(e.request, res.clone()); return res; }).catch(()=>hit);
      return hit || fetchPromise;
    })());
  }
});
