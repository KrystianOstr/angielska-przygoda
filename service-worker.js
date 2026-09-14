const CACHE_NAME="angielska-przygoda-v5";
const BODY_ICONS=["arm","back","belly-button","chest","ear","eye","face","finger","foot","hair","hand","head","knee","leg","mouth","neck","nose","shoulder","stomach","toe","tooth"].map(name=>`/assets/body/${name}.svg`);
const CORE=["/","/index.html","/features.js","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png",...BODY_ICONS];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put("/index.html",copy));return response}).catch(()=>caches.match("/index.html")));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}return response})));
});

