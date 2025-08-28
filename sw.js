const cacheName = "mcq-app-v1.11";
const staticFiles = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./icons/icon-192.png"
];

let dynamicJSON = []; // JSON files sent from page

// Install: cache static files
self.addEventListener("install", evt => {
  evt.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(staticFiles))
      .then(() => self.skipWaiting()) // activate immediately
  );
});

// Activate: clean old caches
self.addEventListener("activate", evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => { if(key !== cacheName) return caches.delete(key); })
    )).then(() => self.clients.claim())
  );
});

// Listen for messages to cache JSON
self.addEventListener("message", async evt => {
  if(evt.data?.type === "CACHE_MCQS" && Array.isArray(evt.data.mcqs)){
    const newJSON = evt.data.mcqs;
    dynamicJSON = newJSON;

    const cache = await caches.open(cacheName);
    const currentRequests = (await cache.keys()).map(req => req.url.split('/').pop());

    for(const file of newJSON){
      const fileName = file.split('/').pop();

      // Append timestamp to force fetch new content
      const urlWithTimestamp = file + '?v=' + Date.now();

      if(!currentRequests.includes(fileName)){
        cache.add(urlWithTimestamp);
        console.log("Added to cache:", fileName);
      }
    }

    // Remove JSON files not in new list
    for(const req of currentRequests){
      if(!newJSON.some(f=>f.split('/').pop() === req) && req.endsWith('.json')){
        cache.delete(req);
        console.log("Removed from cache:", req);
      }
    }
  }
});

// Fetch from cache first
self.addEventListener("fetch", evt => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request))
  );
});
