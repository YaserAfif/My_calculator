const CACHE_NAME = 'mycalc-v21-fees-and-daily-v1';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon.svg','./license-client.js','./license-config.js','./v13.js','./v13.css','./v14.js','./v14.css','./v15.js','./v15.css','./v16.js','./v16.css','./v17.js','./v17.css','./v18.js','./v18.css','./v19.js','./v19.css','./v20.js','./v20.css','./v21.js','./v21.css'];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('mycalc-v13-preview-')||k.startsWith('mycalc-v14-')||k.startsWith('mycalc-v15-')||k.startsWith('mycalc-v16-')||k.startsWith('mycalc-v17-')||k.startsWith('mycalc-v18-')||k.startsWith('mycalc-v19-')||k.startsWith('mycalc-v20-')||k.startsWith('mycalc-v21-'))&&k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
  return response;
 }).catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
