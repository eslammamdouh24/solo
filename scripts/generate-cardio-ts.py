#!/usr/bin/env python3
"""Generate TS code for cardio exercises from /tmp/cardio-all.json."""
import json, re, sys, os

GIF_DIR = "assets/images/exercises"

EQUIP_MAP = {
    "Body Weight": "Bodyweight",
    "Dumbbell": "Dumbbells",
    "Leverage Machine": "Machine",
    "Elliptical Machine": "Machine",
    "Stationary Bike": "Machine",
    "Stepmill Machine": "Machine",
    "Rope": "Other",
}


def slugify(name):
    s = name.lower()
    s = re.sub(r"[\u00b0()]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def ts_str(s):
    if s is None:
        return '""'
    return json.dumps(str(s))


def ts_str_arr(arr):
    if not arr:
        return "[]"
    return "[" + ", ".join(json.dumps(str(s)) for s in arr) + "]"


items = json.load(open("/tmp/cardio-all.json"))

# Emit TS entries
print("// === Cardio exercises (auto-generated from workoutxapp) ===")
print(f"// Total: {len(items)}")
print()

image_lines = []
entries = []
# Avoid id collisions with existing non-cardio exercises.
# (The GIFs can overlap: same workoutx ID = same content, no conflict.)
EXISTING_IDS = {"mountain-climber", "crunch", "squat", "push-up"}
# GIFs already registered in exerciseImages.ts for other muscle groups
EXISTING_GIFS = {"mountain-climber.gif"}

seen_gifs = set(EXISTING_GIFS)
for it in items:
    eid = it["id"]
    slug_base = slugify(it["name"])
    slug = f"cardio-{slug_base}" if slug_base in EXISTING_IDS else slug_base
    gif = f"{slug_base}.gif"
    name = it["name"]
    equipment = EQUIP_MAP.get(it.get("equipment", ""), "Other")
    diff_raw = (it.get("difficulty") or "beginner").lower()
    difficulty = {"beginner": "Beginner", "intermediate": "Intermediate", "advanced": "Advanced"}.get(diff_raw, "Beginner")
    target = it.get("target") or "cardiovascular system"
    secondary = it.get("secondaryMuscles") or []
    instructions = it.get("instructions") or []
    description = it.get("description") or f"{name} is a cardiovascular exercise that elevates heart rate and burns calories."
    cal = it.get("caloriesPerMinute") or 8

    if gif not in seen_gifs:
        seen_gifs.add(gif)
        gif_path = os.path.join(GIF_DIR, gif)
        if os.path.exists(gif_path) and os.path.getsize(gif_path) > 1000:
            image_lines.append(
                f'  "{gif}": require("@/assets/images/exercises/{gif}"),'
            )
        else:
            image_lines.append(f'  // "{gif}": not yet downloaded — will fallback to gifUrl')

    entry = f"""    {{
      id: "{slug}",
      name: {ts_str(name)},
      equipment: "{equipment}",
      difficulty: "{difficulty}",
      gender: "both",
      gif: "{gif}",
      gifUrl: "https://api.workoutxapp.com/v1/gifs/{eid}.gif",
      sets: 1,
      reps: 0,
      duration: 300,
      description: {ts_str(description)},
      descriptionAr: {ts_str(description)},
      caloriesPerMinute: {cal},
      target: {ts_str(target)},
      secondaryMuscles: {ts_str_arr(secondary)},
      instructions: {ts_str_arr(instructions)},
      instructionsAr: {ts_str_arr(instructions)},
    }},"""
    entries.append(entry)

print("// -------- exerciseImages.ts additions --------")
for line in image_lines:
    print(line)

print("\n// -------- EXERCISES.cardio array --------")
print("  cardio: [")
for e in entries:
    print(e)
print("  ],")
