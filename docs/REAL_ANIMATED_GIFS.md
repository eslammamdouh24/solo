# 🎬 Real Animated GIF Databases

## Quick Fix: Restart Metro Bundler First!

```bash
# Kill existing bundler
pkill -f "expo start" or Ctrl+C in terminal

# Clear cache and restart
npx expo start --clear
```

---

## 🔥 Top 3 Sources for Real Animated Exercise GIFs

### 1. **GIPHY API** ⭐ RECOMMENDED

**Best for**: Quick, free, high-quality animated GIFs

```bash
# 1. Get free API key (takes 1 minute)
https://developers.giphy.com/dashboard/

# 2. Use the download script
chmod +x scripts/download-giphy-gifs.sh
# Edit script to add your API key
./scripts/download-giphy-gifs.sh
```

**Pros:**

- ✅ FREE (43 requests/hour)
- ✅ Real animated GIFs
- ✅ Automated download
- ✅ High quality

**Coverage**: ~50-70% of exercises

---

### 2. **Gym Visual API**

**URL**: https://rapidapi.com/nabeeldev1340/api/gym-visual-db

**Pros:**

- ✅ Exercise-specific database
- ✅ Animated GIFs
- ✅ Organized by muscle group
- ⚠️ Requires RapidAPI account (free tier available)

```javascript
// Example API call
const response = await fetch(
  "https://gym-visual-db.p.rapidapi.com/exercise/name/bench-press",
  {
    headers: {
      "X-RapidAPI-Key": "YOUR_KEY",
      "X-RapidAPI-Host": "gym-visual-db.p.rapidapi.com",
    },
  },
);
```

---

### 3. **Fitness API + Tenor**

**Tenor**: https://tenor.com/gifapi

Similar to GIPHY, free API for animated GIFs.

```bash
# Search for exercise GIFs
curl "https://tenor.googleapis.com/v2/search?q=bench%20press%20exercise&key=YOUR_API_KEY&limit=1"
```

---

## 🎯 Recommended Workflow

### Option A: GIPHY (Fastest)

1. Get GIPHY API key (1 min)
2. Run download script (5 min)
3. Update exerciseImages.ts (automatic)
4. Restart app

**Time**: 10 minutes  
**Cost**: FREE  
**Result**: 50-70 animated GIFs

---

### Option B: Mix Approaches

1. Keep current 60 JPEGs (they work!)
2. Download 10 missing as animated GIFs from GIPHY
3. Best of both worlds

**Time**: 5 minutes  
**Cost**: FREE  
**Result**: All 70 exercises covered

---

### Option C: Premium Database

**ExRx GIFs** or **Workout Trainer API**

- Professional quality
- Complete coverage
- May cost $10-50/month

---

## 🚀 Quick Start: GIPHY Download

```bash
# 1. Install dependencies
sudo apt install jq curl  # or: brew install jq

# 2. Get API key
# Visit: https://developers.giphy.com/
# Click "Create an App" → Get API Key

# 3. Edit download script
nano scripts/download-giphy-gifs.sh
# Replace: YOUR_GIPHY_API_KEY_HERE with your key

# 4. Run
chmod +x scripts/download-giphy-gifs.sh
./scripts/download-giphy-gifs.sh

# 5. Update exercise images map
node scripts/update-exercise-extensions.js

# 6. Restart Metro
npx expo start --clear
```

---

## 📊 Comparison

| Source             | Animated? | Free?        | Quality    | Coverage | Setup Time |
| ------------------ | --------- | ------------ | ---------- | -------- | ---------- |
| **GIPHY**          | ✅ Yes    | ✅ Yes       | ⭐⭐⭐⭐   | 60%      | 10 min     |
| **Tenor**          | ✅ Yes    | ✅ Yes       | ⭐⭐⭐     | 50%      | 10 min     |
| **Gym Visual API** | ✅ Yes    | ⚠️ Free tier | ⭐⭐⭐⭐⭐ | 90%      | 15 min     |
| **Current JPGs**   | ❌ No     | ✅ Yes       | ⭐⭐⭐⭐   | 86%      | Done ✅    |
| **ExRx (Premium)** | ✅ Yes    | ❌ Paid      | ⭐⭐⭐⭐⭐ | 100%     | 30 min     |

---

## 💡 My Recommendation

**For now**: Keep your 60 JPGs - they're working great!

**To get animated**:

1. Use GIPHY API for the 10 missing exercises
2. Takes 10 minutes
3. 100% free
4. Good enough quality

**Future**: If you want premium animated GIFs for all 70, consider Gym Visual API or hire someone on Fiverr to record custom ones.

---

## 🐛 Troubleshooting

### Profile Screen Crash

This is likely because Metro bundler has cached old code. Fix:

```bash
# Stop expo (Ctrl+C)
# Clear all caches
npx expo start --clear

# Or nuclear option:
rm -rf node_modules/.cache
rm -rf .expo
npx expo start
```

### GIFs Not Loading

Metro bundler needs restart after adding new image files:

```bash
npx expo start --clear
```

---

Ready to try GIPHY? Just need your API key and 10 minutes! 🚀
