const CACHE_NAME='cemetery-shadar-pwa-1448-v1';
const APP_SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);

  // Same-origin: network-first for HTML, cache-first for static files.
  if(url.origin===self.location.origin){
    if(event.request.mode==='navigate'){
      event.respondWith(
        fetch(event.request).then(res=>{
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put('./index.html',copy));
          return res;
        }).catch(()=>caches.match('./index.html'))
      );
    }else{
      event.respondWith(
        caches.match(event.request).then(cached=>cached || fetch(event.request).then(res=>{
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));
          return res;
        }))
      );
    }
    return;
  }

  // CDN dependencies: stale-while-revalidate, allowing offline use after first online load.
  if(['cdn.tailwindcss.com','cdnjs.cloudflare.com','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)){
    event.respondWith(
      caches.match(event.request).then(cached=>{
        const network=fetch(event.request).then(res=>{
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));
          return res;
        }).catch(()=>cached);
        return cached || network;
      })
    );
  }
});
