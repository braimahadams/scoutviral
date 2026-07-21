/* ScoutViral service worker — installability + offline app-shell fallback.
   Strategy: network-first for every same-origin GET (so a fresh deploy always
   lands and nothing goes stale), with the cache used only as an offline
   fallback. Cross-origin requests (YouTube API, Firebase, Google Fonts) are
   left entirely to the browser — the SW never touches them. */
const CACHE = "scoutviral-shell-v1";
const SHELL = ["/", "/index.html", "/config.js", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;   // hands off cross-origin
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("/index.html")))
  );
});
