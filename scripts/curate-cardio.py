#!/usr/bin/env python3
"""Download cardio GIFs + build curated list using bodyPart listing only (no detail calls)."""
import urllib.request, urllib.error, json, os, re, sys, time

KEY = "wx_83cd386d7cd928a856d43db4dbc9617fd9be19ebee419e2e7559d2df"
GIF_DIR = "assets/images/exercises"
DELAY = 2.0


def slugify(name):
    s = name.lower()
    s = re.sub(r"[\u00b0()]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def download_gif(eid, dest, retries=6):
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        return True
    url = f"https://api.workoutxapp.com/v1/gifs/{eid}.gif"
    backoff = 15
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"X-WorkoutX-Key": KEY})
        try:
            data = urllib.request.urlopen(req, timeout=30).read()
            if len(data) < 1000:
                return False
            with open(dest, "wb") as f:
                f.write(data)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"    429 {eid}, waiting {backoff}s (attempt {attempt+1}/{retries})", flush=True)
                time.sleep(backoff)
                backoff = min(backoff * 2, 120)
                continue
            print(f"    http err {eid}: {e}", flush=True)
            return False
        except Exception as e:
            print(f"    err {eid}: {e}", flush=True)
            time.sleep(backoff)
    return False


os.makedirs(GIF_DIR, exist_ok=True)
items = json.load(open("/tmp/cardio-all.json"))
result = []
for it in items:
    eid = it["id"]
    slug = slugify(it["name"])
    gif_file = f"{slug}.gif"
    gif_path = os.path.join(GIF_DIR, gif_file)
    ok = download_gif(eid, gif_path)
    time.sleep(DELAY)
    if not ok:
        print(f"SKIP {eid} {it['name']}", flush=True)
        continue
    result.append({
        "id": slug,
        "wx_id": eid,
        "name": it["name"],
        "equipment": it.get("equipment"),
        "difficulty": it.get("difficulty", "beginner"),
        "target": it.get("target"),
        "secondaryMuscles": it.get("secondaryMuscles", []),
        "instructions": it.get("instructions", []),
        "description": it.get("description", ""),
        "caloriesPerMinute": it.get("caloriesPerMinute", 8),
        "gif": gif_file,
        "gifUrl": it.get("gifUrl", f"https://api.workoutxapp.com/v1/gifs/{eid}.gif"),
    })
    print(f"OK {eid} {slug}", flush=True)

json.dump(result, open("/tmp/cardio-curated.json", "w"), indent=2)
print(f"\nTotal: {len(result)}/29 cardio exercises curated", flush=True)
