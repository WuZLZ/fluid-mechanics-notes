const CACHE="fluid-atlas-v3-20261010";
const CORE=["./","./index.html","./styles.css?v=3","./app.js?v=3","./notes.json","./assets/favicon.svg"];
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(CORE.map(url=>cache.add(url)));await self.skipWaiting()})())});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith("fluid-atlas-")&&key!==CACHE)await caches.delete(key)}await self.clients.claim()})())});
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
event.respondWith((async()=>{const cache=await caches.open(CACHE);const normalized=new URL(request.url);if(normalized.pathname.endsWith("/notes.json"))normalized.search="";
try{const live=await fetch(request);if(live.ok)cache.put(normalized.href,live.clone());return live}catch(err){return (await cache.match(normalized.href))||(await cache.match(request))||(await cache.match("./index.html"))||Response.error()}})())});
