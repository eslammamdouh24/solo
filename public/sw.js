/* Solo PWA service worker — caches app shell + exercise GIFs for offline use */
const VERSION = "v4";
const SHELL_CACHE = `solo-shell-${VERSION}`;
const ASSET_CACHE = `solo-assets-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      const assets = await caches.open(ASSET_CACHE);

      try {
        const htmlRes = await fetch("/index.html", { cache: "no-store" });
        if (htmlRes.ok) {
          await shell.put("/index.html", htmlRes.clone());
          await shell.put("/", htmlRes.clone());
        }
      } catch (e) {}

      try {
        const manRes = await fetch("/manifest.json", { cache: "no-store" });
        if (manRes.ok) await shell.put("/manifest.json", manRes.clone());
      } catch (e) {}

      try {
        const res = await fetch("/precache-manifest.json", {
          cache: "no-store",
        });
        if (res.ok) {
          const { assets: urls } = await res.json();
          const chunkSize = 12;
          for (let i = 0; i < urls.length; i += chunkSize) {
            const chunk = urls.slice(i, i + chunkSize);
            await Promise.all(
              chunk.map((u) =>
                fetch(u, { cache: "no-store" })
                  .then((r) => (r.ok ? assets.put(u, r.clone()) : null))
                  .catch(() => null),
              ),
            );
          }
        }
      } catch (e) {}
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isBypass(url) {
  return (
    url.includes("supabase.co") ||
    url.includes("supabase.in") ||
    url.includes("/auth/v1/") ||
    url.includes("/rest/v1/") ||
    url.includes("/realtime/") ||
    url.includes("/storage/v1/")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (isBypass(req.url)) return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put("/index.html", res.clone()).catch(() => {});
          }
          return res;
        } catch (e) {
          const cache = await caches.open(SHELL_CACHE);
          const cached =
            (await cache.match("/index.html")) ||
            (await cache.match("/")) ||
            (await caches.match(req));
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  const isAsset =
    sameOrigin &&
    /\.(?:gif|png|jpg|jpeg|svg|webp|ico|woff2?|ttf|otf|mp3|wav|ogg|js|css)$/i.test(
      url.pathname,
    );

  if (isAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res.ok && sameOrigin) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        return Response.error();
      }
    })(),
  );
});
