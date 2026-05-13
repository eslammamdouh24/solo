/* Solo PWA service worker — caches app shell + exercise GIFs for offline use */
const VERSION = "v6";
const SHELL_CACHE = `solo-shell-${VERSION}`;
const ASSET_CACHE = `solo-assets-${VERSION}`;

// Fetch with retries and exponential backoff
async function fetchWithRetry(url, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { cache: "reload" });
      if (res.ok) return res;
      lastErr = new Error("HTTP " + res.status);
    } catch (e) {
      lastErr = e;
    }
    // Backoff: 250ms, 500ms, 1s, 2s
    await new Promise((r) => setTimeout(r, 250 * Math.pow(2, i)));
  }
  throw lastErr;
}

async function precacheAll(cache, urls, chunkSize = 4) {
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (u) => {
        try {
          const r = await fetchWithRetry(u);
          await cache.put(u, r);
          ok++;
        } catch (e) {
          failed++;
        }
      }),
    );
  }
  // Broadcast progress/result to clients
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) =>
    c.postMessage({
      type: "precache-done",
      ok,
      failed,
      total: urls.length,
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      const assets = await caches.open(ASSET_CACHE);

      try {
        const htmlRes = await fetchWithRetry("/index.html");
        await shell.put("/index.html", htmlRes.clone());
        await shell.put("/", htmlRes.clone());
      } catch (e) {}

      try {
        const manRes = await fetchWithRetry("/manifest.json");
        await shell.put("/manifest.json", manRes);
      } catch (e) {}

      try {
        const res = await fetchWithRetry("/precache-manifest.json");
        const { assets: urls } = await res.json();
        await precacheAll(assets, urls, 4);
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

      // On activate, verify precache completeness and fill gaps
      try {
        const res = await fetchWithRetry("/precache-manifest.json");
        const { assets: urls } = await res.json();
        const cache = await caches.open(ASSET_CACHE);
        const missing = [];
        for (const u of urls) {
          if (!(await cache.match(u))) missing.push(u);
        }
        if (missing.length) await precacheAll(cache, missing, 4);
      } catch (e) {}
    })(),
  );
});

function isBypass(url) {
  // Allow avatar images from Supabase Storage to be cached
  if (url.includes("/storage/v1/object/public/avatars/")) return false;
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

  const isAvatar = url.pathname.includes("/storage/v1/object/public/avatars/");
  const isAsset =
    (sameOrigin || isAvatar) &&
    (isAvatar ||
      /\.(?:gif|png|jpg|jpeg|svg|webp|ico|woff2?|ttf|otf|mp3|wav|ogg|js|css)$/i.test(
        url.pathname,
      ));

  if (isAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          // Skip partial (206) responses — Cache API rejects them
          if (res.ok && res.status !== 206) {
            cache.put(req, res.clone()).catch(() => {});
          }
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
        if (res.ok && res.status !== 206 && sameOrigin) {
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
