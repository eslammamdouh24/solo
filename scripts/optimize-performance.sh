#!/bin/bash
# Quick performance optimization script
# Run after: chmod +x scripts/optimize-performance.sh

set -e
cd "$(dirname "$0")/.."

echo "🔍 Performance Optimization Script"
echo "=================================="
echo

# 1. Current size
echo "📊 Current build size:"
npm run build > /dev/null 2>&1
du -sh dist/
du -sh dist/_expo/static/js/web/
find dist/assets -name "*.gif" -type f -printf "%s\n" | awk '{sum+=$1} END {print "  GIFs:", NR, "files,", sum/1024/1024, "MB"}'
echo

# 2. Check for gifsicle
if ! command -v gifsicle &> /dev/null; then
    echo "⚠️  gifsicle not installed. Install it:"
    echo "    sudo apt install gifsicle    # Ubuntu/Debian"
    echo "    brew install gifsicle         # macOS"
    echo
else
    echo "🎨 Optimizing GIFs with gifsicle..."
    count=0
    for gif in assets/images/exercises/*.gif; do
        orig_size=$(stat -c%s "$gif" 2>/dev/null || stat -f%z "$gif")
        gifsicle --optimize=3 --lossy=80 "$gif" -o "$gif.tmp"
        new_size=$(stat -c%s "$gif.tmp" 2>/dev/null || stat -f%z "$gif.tmp")
        savings=$((orig_size - new_size))
        if [ $savings -gt 0 ]; then
            mv "$gif.tmp" "$gif"
            count=$((count + 1))
            echo "  ✓ $(basename "$gif"): saved $((savings / 1024)) KB"
        else
            rm "$gif.tmp"
        fi
    done
    echo "  Optimized $count GIFs"
    echo
fi

# 3. Check unused dependencies
echo "📦 Checking for unused dependencies..."
if ! command -v depcheck &> /dev/null; then
    echo "  Installing depcheck..."
    npm install -g depcheck > /dev/null 2>&1
fi
depcheck --ignores="@types/*,eslint-*,prettier,typescript" | head -20
echo

# 4. Rebuild and compare
echo "🔨 Rebuilding..."
npm run build > /dev/null 2>&1
echo "📊 New build size:"
du -sh dist/
find dist/assets -name "*.gif" -type f -printf "%s\n" | awk '{sum+=$1} END {print "  GIFs:", NR, "files,", sum/1024/1024, "MB"}'
echo

# 5. Recommendations
echo "✅ Next steps:"
echo "  1. Review unused dependencies above"
echo "  2. Update service worker to lazy-load GIFs (see docs/PERFORMANCE_OPTIMIZATION.md)"
echo "  3. Run Lighthouse: lighthouse https://your-site.com --view"
echo "  4. Test on slow 3G in Chrome DevTools"
echo
echo "📖 Full guide: docs/PERFORMANCE_OPTIMIZATION.md"
