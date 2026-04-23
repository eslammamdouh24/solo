#!/usr/bin/env python3
import urllib.request, json, sys

KEY = "wx_83cd386d7cd928a856d43db4dbc9617fd9be19ebee419e2e7559d2df"
BASE = "https://api.workoutxapp.com/v1/exercises/bodyPart/cardio"

all_items = []
seen = set()
for offset in range(0, 200, 10):
    url = f"{BASE}?offset={offset}"
    req = urllib.request.Request(url, headers={"X-WorkoutX-Key": KEY})
    try:
        d = json.loads(urllib.request.urlopen(req, timeout=15).read())
    except Exception as e:
        print("err", e, file=sys.stderr); break
    items = d.get("data", [])
    if not items: break
    new = [i for i in items if i["id"] not in seen]
    if not new: break
    for i in new:
        seen.add(i["id"])
        all_items.append(i)

print(f"total: {len(all_items)}")
for e in all_items:
    print(f"{e['id']} | {e['name']} | {e['equipment']} | {e.get('difficulty')}")

with open("/tmp/cardio-all.json", "w") as f:
    json.dump(all_items, f, indent=2)
