/* Guion con voz · se autoelimina.
   El service worker anterior interceptaba los mp3 y, en iPhone, rompía la reproducción
   porque no respondía peticiones Range (206). Ya no intercepta nada y se da de baja. */
self.addEventListener('install', event=>{
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event=>{
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }catch(e){}
    try{ await self.registration.unregister(); }catch(e){}
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for(const c of clients){
      try{ c.navigate(c.url); }catch(e){}
    }
  })());
});
