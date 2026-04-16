#!/bin/bash
# Post-export script: patches index.html to prevent hydration and copies vercel.json

DIST_DIR="$(dirname "$0")/../dist"

# Add anti-hydration script before the app bundle
sed -i 's|<div id="root"></div>|<div id="root"></div>\n  <script>globalThis.__EXPO_ROUTER_HYDRATE__=false;</script>|' "$DIST_DIR/index.html"

# Copy vercel config
cat > "$DIST_DIR/vercel.json" << 'EOF'
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}
EOF

echo "Post-export patches applied"
