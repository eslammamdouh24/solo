# MuscleWiki Exercise GIF Research

## Summary

MuscleWiki has **1,900+ exercises** with **7,500+ video demonstrations** available through their official API. However, there are **significant licensing restrictions** on downloading their media content.

---

## 🔑 Key Findings

### 1. **API Access**

- **Endpoint**: `https://api.musclewiki.com`
- **Documentation**: https://api.musclewiki.com/documentation
- **Content**: 1,900+ exercises covering all major muscle groups
- **Videos**: Multiple angles (front/side) and gender variants (male/female)
- **Format**: MP4 videos (not GIFs, but can be converted)

### 2. **Pricing Plans**

| Plan    | Price   | API Calls     | Access Level                          |
| ------- | ------- | ------------- | ------------------------------------- |
| BASIC   | Free    | 500/month     | Playground only (no direct downloads) |
| TESTING | $5/mo   | 1,000/month   | API key access (no routines/workouts) |
| PRO     | $29/mo  | 20,000/month  | Full exercise access                  |
| ULTRA   | $79/mo  | 100,000/month | Everything including routines         |
| MEGA    | $199/mo | 300,000/month | Enterprise with priority support      |

### 3. **Video URL Structure**

Videos are streamed via authenticated endpoints:

**Branded Videos** (with MuscleWiki watermark):

```
GET /stream/videos/branded/{filename}
Headers: X-API-Key: YOUR_API_KEY

Example: male-Barbell-barbell-curl-front.mp4
```

**Unbranded Videos**:

```
GET /stream/videos/unbranded/{filename}
Headers: X-API-Key: YOUR_API_KEY

Example: male-Barbell-barbell-curl-front.mp4
```

**Naming Convention**:

```
{gender}-{Category}-{exercise-name}-{angle}.mp4

gender: male | female
Category: Barbell | Dumbbell | Bodyweight | etc.
exercise-name: bench-press | squat | deadlift | etc.
angle: front | side
```

### 4. **API Endpoints**

#### Get All Exercises (Paginated)

```bash
curl --request GET \
  --url 'https://api.musclewiki.com/exercises?limit=100&category=barbell' \
  --header 'X-API-Key: YOUR_API_KEY'
```

#### Get Specific Exercise Details

```bash
curl --request GET \
  --url 'https://api.musclewiki.com/exercises/1' \
  --header 'X-API-Key: YOUR_API_KEY'
```

#### Stream Video File

```bash
curl --request GET \
  --url 'https://api.musclewiki.com/stream/videos/unbranded/male-Barbell-barbell-curl-front.mp4' \
  --header 'X-API-Key: YOUR_API_KEY' \
  --output video.mp4
```

**Response includes**:

- Exercise ID, name, difficulty
- Primary muscles, category, force type
- Step-by-step instructions
- Video URLs for all angles/genders

### 5. **Filtering Options**

The API supports filtering by:

- `muscles` - Biceps, Chest, Quads, etc.
- `category` - barbell, dumbbell, bodyweight, etc.
- `difficulty` - novice, intermediate, advanced
- `force` - push, pull, static
- `mechanic` - isolation, compound
- `gender` - male, female

---

## ⚖️ **LICENSING & LEGAL RESTRICTIONS**

### ❌ **What You CANNOT Do** (Per API Terms)

From `https://api.musclewiki.com/api-terms`:

1. **NO DOWNLOADING** - "You may NOT download, export, copy, store, or otherwise retrieve MuscleWiki videos, thumbnails, or bodymap images for offline storage, CDN storage, cloud storage"

2. **NO SCRAPING** - "You may NOT scrape, crawl, harvest, or mass-download videos, images, or video URLs"

3. **NO REDISTRIBUTION** - "You may NOT re-host or upload videos or images to your own servers, CDNs, or social media"

4. **NO BULK EXPORT** - Cannot build datasets or APIs that compete with MuscleWiki

5. **CACHING LIMITS**:
   - Metadata: Up to 30 days
   - Thumbnails/images: Up to 24 hours
   - Videos: **Transient caching only** (in-memory playback buffers)

6. **NO AI TRAINING** - "Use any API content to train machine learning models, AI systems, or datasets without written permission"

### ✅ **What You CAN Do** (Per Website Terms)

From `https://musclewiki.com/terms`:

> "Some MuscleWiki content may be used free of charge without prior consent. **Videos, instructional text, and muscle information may be shared with MuscleWiki branding and links to musclewiki.com, and only for non-profit or academic use.**"

**Requirements for Free Use**:

- ✅ Non-profit or academic purposes only
- ✅ Must include MuscleWiki branding
- ✅ Must link to musclewiki.com
- ✅ Must include attribution: "images/content created by musclewiki.com and are used here with permission from MuscleWiki"

**For Commercial Use**:

- Must contact: hello@musclewiki.com
- Need explicit written permission
- Must specify which content and where it will be used

---

## 🎯 **Recommendations for Your Project**

### Option 1: **Use MuscleWiki API (Recommended for Commercial)**

**Pros**:

- Legal and compliant
- 1,900+ professionally filmed exercises
- Multiple angles and genders
- Regular updates

**Cons**:

- Requires paid subscription ($5-29/mo minimum)
- Must stream videos (cannot download permanently)
- API call limits

**Implementation**:

1. Sign up at https://api.musclewiki.com/register
2. Get TESTING ($5/mo) or PRO ($29/mo) plan
3. Fetch exercise data and stream videos in your app
4. Display attribution as required

### Option 2: **Request Non-Profit/Academic Permission**

If your app is:

- Non-profit
- Educational
- Open-source community project

**Steps**:

1. Email: hello@musclewiki.com
2. Explain your project's non-profit/academic nature
3. Request permission to use videos with attribution
4. Follow their branding/attribution requirements

### Option 3: **Alternative Free Sources**

Consider these free alternatives:

1. **Giphy** (what you're currently using) - Free, no restrictions
2. **ExRx.net** - Public domain exercise database
3. **Create your own** - Film custom exercises
4. **Open Fitness Library** - Community-contributed exercises

### Option 4: **Hybrid Approach**

- Use Giphy for free tier users
- Offer MuscleWiki integration as premium feature
- Stream videos via their API (don't download)

---

## 📋 **Sample Download Script (For Testing/Evaluation Only)**

**⚠️ WARNING**: This script is for **evaluation purposes only**. Commercial use without permission violates their Terms.

```javascript
// scripts/download-musclewiki-gifs.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.MUSCLEWIKI_API_KEY; // Get from https://api.musclewiki.com
const BASE_URL = "https://api.musclewiki.com";

// Exercises we want
const targetExercises = [
  "bench press",
  "squat",
  "deadlift",
  "pull up",
  "push up",
  "bicep curl",
  "shoulder press",
  "lat pulldown",
  "leg press",
  "tricep dip",
  "plank",
  "lunge",
  "row",
];

async function fetchExercises() {
  try {
    const response = await axios.get(`${BASE_URL}/exercises`, {
      headers: { "X-API-Key": API_KEY },
      params: {
        limit: 100,
        difficulty: "intermediate",
      },
    });
    return response.data.results;
  } catch (error) {
    console.error("Error fetching exercises:", error.message);
    throw error;
  }
}

async function getExerciseDetails(exerciseId) {
  try {
    const response = await axios.get(`${BASE_URL}/exercises/${exerciseId}`, {
      headers: { "X-API-Key": API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching exercise ${exerciseId}:`, error.message);
    return null;
  }
}

async function downloadVideo(url, filename) {
  try {
    const response = await axios.get(url, {
      headers: { "X-API-Key": API_KEY },
      responseType: "stream",
    });

    const outputPath = path.join(__dirname, "..", "assets", "videos", filename);
    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(outputPath));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading ${filename}:`, error.message);
    return null;
  }
}

async function main() {
  if (!API_KEY) {
    console.error("Please set MUSCLEWIKI_API_KEY environment variable");
    process.exit(1);
  }

  console.log(
    "⚠️  NOTE: This is for evaluation only. Commercial use requires permission.",
  );
  console.log("📧 Contact hello@musclewiki.com for commercial licensing\n");

  // Create output directory
  const videoDir = path.join(__dirname, "..", "assets", "videos");
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  // Fetch exercises
  console.log("Fetching exercises...");
  const exercises = await fetchExercises();

  // Filter to our target exercises
  const matchedExercises = exercises.filter((ex) =>
    targetExercises.some((target) => ex.name.toLowerCase().includes(target)),
  );

  console.log(`Found ${matchedExercises.length} matching exercises\n`);

  // Download videos for each exercise
  for (const exercise of matchedExercises) {
    console.log(`Processing: ${exercise.name}`);

    const details = await getExerciseDetails(exercise.id);
    if (!details || !details.videos) continue;

    // Download male front view (primary)
    const maleVideo = details.videos.find(
      (v) => v.gender === "male" && v.angle === "front",
    );

    if (maleVideo) {
      const filename = `${exercise.name.toLowerCase().replace(/\s+/g, "-")}-male-front.mp4`;
      console.log(`  Downloading: ${filename}`);
      await downloadVideo(maleVideo.url, filename);
    }
  }

  console.log("\n✅ Download complete!");
  console.log("⚠️  Remember: Add MuscleWiki attribution to your app");
}

main().catch(console.error);
```

---

## 🎬 **Converting MP4 to GIF**

If you need GIFs instead of MP4s:

```bash
# Using ffmpeg
ffmpeg -i input.mp4 -vf "fps=10,scale=320:-1:flags=lanczos" -loop 0 output.gif

# Optimize GIF size
gifsicle -O3 --colors 128 output.gif -o optimized.gif
```

---

## 📞 **Contact Information**

- **General Support**: info@musclewiki.com
- **Business/Licensing**: hello@musclewiki.com
- **API Dashboard**: https://api.musclewiki.com/dashboard
- **Documentation**: https://api.musclewiki.com/documentation

---

## ⚡ **Quick Decision Matrix**

| Your Situation                    | Recommended Action                                  |
| --------------------------------- | --------------------------------------------------- |
| Commercial app, can afford $29/mo | Use MuscleWiki API (PRO plan) - stream videos       |
| Non-profit/academic project       | Email for permission, use with attribution          |
| Testing/prototyping               | Use free BASIC plan (playground)                    |
| Can't afford API                  | Use Giphy or create own content                     |
| Need offline access               | **Not possible** with MuscleWiki - use alternatives |

---

## 🔒 **Legal Compliance Summary**

1. **DO NOT** bulk download their videos without permission
2. **DO** use their API if you can afford it
3. **DO** contact them for non-profit/academic use permission
4. **DO** provide attribution if granted permission
5. **DO** consider free alternatives if budget is limited

---

## 🎯 **For Your Current Project**

Given that you already have Giphy integration and this appears to be a personal/community fitness app, I recommend:

### Short-term:

✅ **Stick with Giphy** - it's working and legally safe

### Medium-term:

✅ **Add MuscleWiki as premium feature** - $29/mo PRO plan

- Stream videos in-app (don't download)
- Add required attribution
- Offer as "Pro" or "HD Demos" feature

### Long-term:

✅ **Film your own exercises** or **partner with a trainer**

- Full control
- No licensing issues
- Unique content

---

**Last Updated**: April 16, 2026
**Researched by**: GitHub Copilot
**Sources**:

- https://api.musclewiki.com/documentation
- https://api.musclewiki.com/api-terms
- https://musclewiki.com/terms
- https://musclewiki.com/about
