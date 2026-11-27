/* Guion con voz · Centenario */
const CACHE='gv-centenario-v3';
self.addEventListener('install', event=>{
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  event.respondWith((async()=>{
    const cached=await caches.match(req, {ignoreSearch:true});
    if(cached) return cached;
    try{
      const res=await fetch(req);
      // cache same-origin successes for offline reuse
      if(res && res.ok && new URL(req.url).origin===location.origin){
        const cache=await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    }catch(e){
      if(cached) return cached;
      throw e;
    }
  })());
});
