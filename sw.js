const CACHE='app-premier-0.3.2';
const ASSETS=['./','index.html','styles.css?v=0.3.2','app.js?v=0.3.2','icon.svg?v=0.3.2','icon-192.png?v=0.3.2','icon-512.png?v=0.3.2','manifest.webmanifest?v=0.3.2'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('app-premier-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||event.request.method!=='GET')return;
 if(url.pathname.endsWith('/premier.json')||url.pathname.includes('/api/'))return;
 event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
  return response;
 }).catch(()=>caches.match(event.request).then(async cached=>cached||(event.request.mode==='navigate'?await caches.match('index.html'):null)||Response.error())));
});
