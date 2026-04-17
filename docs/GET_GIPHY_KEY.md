# 🎬 Quick Guide: Get Animated GIFs

## ⚡ Get GIPHY API Key (2 minutes, FREE)

### Step 1: Sign Up

1. Visit: https://developers.giphy.com/dashboard/
2. Click "Create an Account" or "Sign In"
3. Use your email or GitHub account

### Step 2: Create an App

1. Click "Create an App"
2. Select "API" (not SDK)
3. App Name: "Solo Fitness App"
4. Description: "Exercise demonstrations"
5. Click "Create App"

### Step 3: Copy API Key

You'll see your API Key immediately. Copy it!

---

## 🚀 Run Download Script

```bash
# Method 1: Environment variable (temporary)
GIPHY_API_KEY=your_actual_key_here node scripts/download-animated-gifs.js

# Method 2: Save to .env file (permanent)
echo "GIPHY_API_KEY=your_actual_key_here" >> .env
node scripts/download-animated-gifs.js
```

---

## 📝 Example

If your API key is: `abc123xyz456`

```bash
GIPHY_API_KEY=abc123xyz456 node scripts/download-animated-gifs.js
```

This will:

- ✅ Download 70 animated GIFs (takes ~5 minutes)
- ✅ Save to assets/images/exercises/
- ✅ 100% coverage

---

## 🔄 After Download

```bash
# 1. Delete old JPEGs
rm assets/images/exercises/*.jpg

# 2. Update image references (already using .gif)
# exerciseImages.ts is already configured for .gif files

# 3. Restart Metro
npx expo start --clear
```

---

## ❓ Troubleshooting

### "No results found"

- You're using DEMO_KEY (limited)
- Get real API key from steps above

### "Rate limit exceeded"

- Free tier: 1000 requests/day
- You only need 70, so this shouldn't happen
- Wait an hour or get a new key

### "API key invalid"

- Check you copied the full key
- Make sure no extra spaces
- Try creating a new app and key

---

## 🎯 Alternative: Manual Download

If GIPHY doesn't work, download manually:

1. Visit: https://giphy.com/search/workout
2. Search each exercise (e.g., "bench press exercise")
3. Click GIF → Download → Original
4. Save as `bench-press.gif` in `assets/images/exercises/`

---

Ready? Get your GIPHY key and let's download! 🚀
