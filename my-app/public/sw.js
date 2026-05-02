self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  // basic network-first strategy for a dynamic VMS app
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
