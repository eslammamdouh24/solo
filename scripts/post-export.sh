#!/bin/bash
# Post-export script: patches index.html to prevent hydration and copies Netlify redirects

DIST_DIR="$(dirname "$0")/../dist"

# Add anti-hydration script before the app bundle
sed -i 's|<div id="root"></div>|<div id="root"></div>\n  <script>globalThis.__EXPO_ROUTER_HYDRATE__=false;</script>|' "$DIST_DIR/index.html"

# Copy Netlify SPA redirect rule
echo "/*    /index.html   200" > "$DIST_DIR/_redirects"

echo "Post-export patches applied"
