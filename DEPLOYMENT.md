# Solo - Deployment Guide

## Current Setup

- Expo web app with React Native
- Build command: `npm run build` → exports to `dist/`
- Progressive Web App (PWA) with service worker
- Supabase backend (already deployed)

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Why Vercel:**

- Zero-config deployment
- Free tier with unlimited bandwidth
- Automatic deployments from GitHub
- Built-in SSL
- Global CDN

**Steps:**

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Login:**

   ```bash
   vercel login
   ```

3. **Deploy:**

   ```bash
   cd /home/eslam/Learning/Solo
   npm run build  # Build the app first
   vercel --prod
   ```

4. **Configure (first deploy):**
   - Project name: `solo` (or your choice)
   - Framework: Select "Other"
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

5. **Auto-deploy from GitHub:**
   - Connect your GitHub repo on vercel.com
   - Every push to `master` auto-deploys

**Create vercel.json:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

### Option 2: Netlify

**Steps:**

1. **Install Netlify CLI:**

   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**

   ```bash
   netlify login
   ```

3. **Deploy:**

   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

4. **Create netlify.toml:**

   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

---

### Option 3: Expo Application Services (EAS)

**For mobile apps + web:**

1. **Install EAS CLI:**

   ```bash
   npm install -g eas-cli
   ```

2. **Configure:**

   ```bash
   eas build:configure
   ```

3. **Build for web:**
   ```bash
   eas build --platform web
   ```

**Note:** EAS is better for mobile app distribution (iOS App Store, Google Play)

---

### Option 4: GitHub Pages (Free Static Hosting)

**Steps:**

1. **Install gh-pages:**

   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts:**

   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

3. **Deploy:**

   ```bash
   npm run deploy
   ```

4. **Configure GitHub:**
   - Repo Settings → Pages
   - Source: `gh-pages` branch
   - Your site: `https://eslammamdouh24.github.io/solo/`

---

## 🔧 Pre-Deployment Checklist

- [ ] Build runs without errors: `npm run build`
- [ ] Environment variables set (if needed)
- [ ] Supabase URL/key configured in production
- [ ] Test built app locally: `npx serve dist`
- [ ] Check PWA manifest and service worker
- [ ] Verify mobile responsiveness
- [ ] Test on different browsers

---

## 📱 Mobile App Deployment (Optional)

### iOS (TestFlight / App Store)

```bash
eas build --platform ios
eas submit --platform ios
```

**Requirements:**

- Apple Developer account ($99/year)
- Mac for local builds (or use EAS cloud build)

### Android (Google Play / APK)

```bash
eas build --platform android
eas submit --platform android
```

**Requirements:**

- Google Play Developer account ($25 one-time)
- Signing key

---

## 🌐 Custom Domain (After Deployment)

### Vercel:

1. Project Settings → Domains
2. Add your domain (e.g., `solo-app.com`)
3. Update DNS records (provided by Vercel)

### Netlify:

1. Site Settings → Domain Management
2. Add custom domain
3. Update DNS records

---

## 🔒 Environment Variables

If you need to set production environment variables:

### Vercel:

```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
```

### Netlify:

Site Settings → Environment Variables → Add Variable

---

## 📊 Analytics (Optional)

Add analytics after deployment:

- Vercel Analytics (free for personal projects)
- Google Analytics
- Plausible Analytics
- Mixpanel

---

## Quick Start (Vercel - 2 Minutes)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build your app
npm run build

# 3. Deploy
vercel --prod

# 4. Answer prompts, done! 🎉
```

Your app will be live at `https://solo-xxx.vercel.app`

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- EAS Docs: https://docs.expo.dev/eas/
- Expo Web: https://docs.expo.dev/workflow/web/
