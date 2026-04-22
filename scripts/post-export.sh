#!/bin/bash
# Post-export script: patches index.html to prevent hydration,
# registers the PWA service worker, and copies Netlify redirects

DIST_DIR="$(dirname "$0")/../dist"
PUBLIC_DIR="$(dirname "$0")/../public"

# Copy public/ assets (sw.js, manifest.json) into dist/
if [ -d "$PUBLIC_DIR" ]; then
  cp -r "$PUBLIC_DIR"/. "$DIST_DIR"/
fi

# Generate a precache manifest listing every static asset in dist/
# The service worker reads this to cache everything on install.
(
  cd "$DIST_DIR" || exit 1
  echo '{'
  echo '  "assets": ['
  find assets _expo -type f \( \
    -name "*.gif" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \
    -o -name "*.svg" -o -name "*.webp" -o -name "*.ico" \
    -o -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" -o -name "*.otf" \
    -o -name "*.mp3" -o -name "*.wav" -o -name "*.ogg" \
    -o -name "*.js" -o -name "*.css" \) \
    | sed 's|^|    "/|;s|$|",|' \
    | sed '$ s/,$//'
  echo '  ]'
  echo '}'
) > "$DIST_DIR/precache-manifest.json"

# Add anti-hydration script + PWA manifest link + SW registration
sed -i 's|<div id="root"></div>|<div id="root"></div>\n  <script>globalThis.__EXPO_ROUTER_HYDRATE__=false;</script>\n  <link rel="manifest" href="/manifest.json">\n  <meta name="theme-color" content="#0A0E27">\n  <script>if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(e){console.warn("SW reg failed",e)})})}</script>|' "$DIST_DIR/index.html"

# Copy Netlify SPA redirect rule
echo "/*    /index.html   200" > "$DIST_DIR/_redirects"

ASSET_COUNT=$(grep -c '^    "/' "$DIST_DIR/precache-manifest.json" || echo 0)
echo "Post-export patches applied (PWA + hydration + redirects, precaching $ASSET_COUNT assets)"
