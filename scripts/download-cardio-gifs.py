#!/usr/bin/env python3
"""Download missing cardio GIFs with aggressive backoff + resume."""
import urllib.request, urllib.error, json, os, re, sys, time

KEY = "wx_83cd386d7cd928a856d43db4dbc9617fd9be19ebee419e2e7559d2df"
GIF_DIR = "assets/images/exercises"
DELAY = 4.0
RATE_LIMIT_SLEEP = 90


def slugify(name):
    s = name.lower()
    s = re.sub(r"[\u00b0()]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def download_gif(eid, dest, max_retries=8):
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        return True
    url = f"https://api.workoutxapp.com/v1/gifs/{eid}.gif"
    for attempt in range(max_retries):
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
                wait = RATE_LIMIT_SLEEP * (attempt + 1)
                print(f"    429 {eid}, waiting {wait}s ({attempt+1}/{max_retries})", flush=True)
                time.sleep(wait)
                continue
            print(f"    err {eid}: {e}", file=sys.stderr)
            return False
        except Exception as e:
            print(f"    err {eid}: {e}", file=sys.stderr)
            return False
    return False


os.makedirs(GIF_DIR, exist_ok=True)
items = json.load(open("/tmp/cardio-all.json"))

# Build curated list using only listing-level fields (no per-ID detail calls)
result = []
for it in items:
    eid = it["id"]
    slug = slugify(it["name"])
    gif_file = f"{slug}.gif"
    gif_path = os.path.join(GIF_DIR, gif_file)
    already = os.path.exists(gif_path) and os.path.getsize(gif_path) > 1000
    ok = already or download_gif(eid, gif_path)
    if not already and ok:
        time.sleep(DELAY)  # polite delay between successful downloads
    if not ok:
        print(f"SKIP {eid} {it['name']}")
        continue
    result.append(
        {
            "id": slug,
            "wx_id": eid,
            "name": it["name"],
            "equipment": it.get("equipment", ""),
            "difficulty": it.get("difficulty", "beginner"),
            "target": it.get("target", "cardiovascular system"),
            "secondaryMuscles": it.get("secondaryMuscles", []),
            "instructions": it.get("instructions", []),
            "description": it.get("description", ""),
            "caloriesPerMinute": it.get("caloriesPerMinute", 8),
            "gif": gif_file,
            "gifUrl": f"https://api.workoutxapp.com/v1/gifs/{eid}.gif",
        }
    )
    print(f"OK {eid} {slug}", flush=True)

json.dump(result, open("/tmp/cardio-curated.json", "w"), indent=2)
print(f"\nTotal: {len(result)}/{len(items)} curated")
