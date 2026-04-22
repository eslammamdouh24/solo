/* Solo PWA service worker — caches app shell + exercise GIFs for offline use */
const VERSION = "v1";
const SHELL_CACHE = `solo-shell-${VERSION}`;
const ASSET_CACHE = `solo-assets-${VERSION}`;

// URLs that should always be fetched first then cached
const SHELL_URLS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// Never cache Supabase / auth / API calls
function isBypass(url) {
  return (
    url.includes("supabase.co") ||
    url.includes("supabase.in") ||
    url.includes("/auth/") ||
    url.includes("/rest/") ||
    url.includes("/realtime/")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = req.url;
  if (isBypass(url)) return;

  const isAsset =
    /\.(?:gif|png|jpg|jpeg|svg|webp|ico|woff2?|ttf|otf|mp3|wav|ogg)$/i.test(
      url,
    );

  if (isAsset) {
    // Cache-first for static assets (GIFs, fonts, etc.)
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return cached || Response.error();
        }
      }),
    );
    return;
  }

  // Network-first for everything else, fallback to cache, fallback to shell
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Navigation fallback → serve cached index
        if (req.mode === "navigate") {
          const shell = await caches.match("/index.html");
          if (shell) return shell;
        }
        return Response.error();
      }
    })(),
  );
});
