#!/usr/bin/env node
/**
 * Download ALL WorkoutX exercise GIFs locally.
 * Uses the cached /tmp/workoutx-all.json for exercise data.
 * Handles rate limiting with retries and delays.
 * Skips already-downloaded files.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const API_KEY = "wx_83cd386d7cd928a856d43db4dbc9617fd9be19ebee419e2e7559d2df";
const GIF_DIR = path.join(__dirname, "..", "assets", "images", "exercises");
const DATA_FILE = "/tmp/workoutx-all.json";
const PROGRESS_FILE = "/tmp/gif-download-progress.json";

// Delay between downloads (ms) to avoid rate limiting
const DELAY_MS = 1000;
// Delay after a 429 (ms)
const RETRY_DELAY_MS = 30000;
// Max retries per file
const MAX_RETRIES = 10;
// Batch pause: after this many downloads, take a longer break
const BATCH_SIZE = 25;
const BATCH_PAUSE_MS = 15000;

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[°]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { "X-WorkoutX-Key": API_KEY },
    };

    https
      .get(url, options, (res) => {
        if (res.statusCode === 429) {
          res.resume();
          return reject(new Error("RATE_LIMITED"));
        }
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Follow redirect
          return downloadFile(res.headers.location, destPath)
            .then(resolve)
            .catch(reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
        fileStream.on("error", reject);
      })
      .on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return { downloaded: [] };
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
}

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error("No cached data at", DATA_FILE);
    console.error("Run the fetch script first to populate it.");
    process.exit(1);
  }

  const exercises = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log(`Total exercises: ${exercises.length}`);

  // Create output dir
  if (!fs.existsSync(GIF_DIR)) {
    fs.mkdirSync(GIF_DIR, { recursive: true });
  }

  // Build download list: map each exercise to a slug filename
  const downloadList = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    slug: slugify(e.name),
    gifUrl: e.gifUrl,
    filename: slugify(e.name) + ".gif",
  }));

  // Check for duplicate slugs and make unique
  const slugCount = {};
  for (const item of downloadList) {
    slugCount[item.slug] = (slugCount[item.slug] || 0) + 1;
  }
  const slugSeen = {};
  for (const item of downloadList) {
    if (slugCount[item.slug] > 1) {
      slugSeen[item.slug] = (slugSeen[item.slug] || 0) + 1;
      if (slugSeen[item.slug] > 1) {
        item.slug = item.slug + "-v" + slugSeen[item.slug];
        item.filename = item.slug + ".gif";
      }
    }
  }

  // Load progress to skip already-completed downloads
  const progress = loadProgress();
  const alreadyDone = new Set(progress.downloaded);

  // Check what's already on disk
  const existingFiles = new Set(fs.readdirSync(GIF_DIR));

  const toDownload = downloadList.filter(
    (item) => !existingFiles.has(item.filename) && !alreadyDone.has(item.id),
  );

  console.log(`Already on disk: ${existingFiles.size}`);
  console.log(`To download: ${toDownload.length}`);
  console.log();

  // Initial cool-down test: try first download, if 429 wait 60s
  if (toDownload.length > 0) {
    try {
      const testUrl = toDownload[0].gifUrl;
      await new Promise((resolve, reject) => {
        const options = { headers: { "X-WorkoutX-Key": API_KEY } };
        https
          .get(testUrl, options, (res) => {
            res.resume();
            if (res.statusCode === 429) reject(new Error("RATE_LIMITED"));
            else resolve();
          })
          .on("error", reject);
      });
      console.log("API is ready, starting downloads...");
    } catch {
      console.log("API is rate-limited. Waiting 60s for cool-down...");
      await sleep(60000);
    }
  }

  let downloaded = 0;
  let failed = 0;
  let rateLimited = 0;

  for (let i = 0; i < toDownload.length; i++) {
    const item = toDownload[i];
    const destPath = path.join(GIF_DIR, item.filename);

    let success = false;
    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      try {
        await downloadFile(item.gifUrl, destPath);
        success = true;
        break;
      } catch (err) {
        if (err.message === "RATE_LIMITED") {
          rateLimited++;
          const waitTime = RETRY_DELAY_MS * (retry + 1);
          process.stdout.write(` [429 - waiting ${waitTime / 1000}s]`);
          await sleep(waitTime);
        } else {
          console.error(`\n  Error ${item.id}: ${err.message}`);
          if (retry < MAX_RETRIES - 1) await sleep(2000);
        }
      }
    }

    if (success) {
      downloaded++;
      progress.downloaded.push(item.id);

      // Save progress every 50 downloads
      if (downloaded % 50 === 0) {
        saveProgress(progress);
      }

      // Size of downloaded file
      const stat = fs.statSync(destPath);
      const sizeKB = (stat.size / 1024).toFixed(0);
      process.stdout.write(
        `\r[${i + 1}/${toDownload.length}] ${item.filename} (${sizeKB}KB) - ${downloaded} done, ${failed} failed`,
      );
    } else {
      failed++;
      console.error(
        `\n  FAILED: ${item.id} ${item.name} after ${MAX_RETRIES} retries`,
      );
    }

    // Delay between requests
    if (i < toDownload.length - 1) {
      await sleep(DELAY_MS);
      // Batch pause every BATCH_SIZE downloads
      if (downloaded > 0 && downloaded % BATCH_SIZE === 0) {
        process.stdout.write(
          `\n  [Batch pause ${BATCH_PAUSE_MS / 1000}s after ${downloaded} downloads...]\n`,
        );
        await sleep(BATCH_PAUSE_MS);
      }
    }
  }

  // Save final progress
  saveProgress(progress);

  console.log("\n");
  console.log("=== Download Complete ===");
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Rate limited hits: ${rateLimited}`);
  console.log(`Total GIFs on disk: ${fs.readdirSync(GIF_DIR).length}`);
  console.log(`Folder size: check with 'du -sh ${GIF_DIR}'`);

  if (failed > 0) {
    console.log("\nRe-run this script to retry failed downloads.");
  }
}

main().catch(console.error);
