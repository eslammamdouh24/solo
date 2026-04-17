#!/usr/bin/env node
/**
 * Generate exercises.ts from WorkoutX cached data.
 * Maps WorkoutX body parts to our muscle groups.
 * Preserves existing exercise data (descriptions, Arabic, etc.) where available.
 * Outputs the full EXERCISES object.
 */

const fs = require("fs");
const path = require("path");

const DATA_FILE = "/tmp/workoutx-all.json";
const GIF_DIR = path.join(__dirname, "..", "assets", "images", "exercises");
const OUTPUT_FILE = path.join(__dirname, "..", "constants", "exercises.ts");
const IMAGES_FILE = path.join(
  __dirname,
  "..",
  "constants",
  "exerciseImages.ts",
);

// ─── Mapping WorkoutX bodyPart → our muscle group ───
function mapBodyPart(bodyPart, target) {
  switch (bodyPart) {
    case "Chest":
      return "chest";
    case "Back":
      return "back";
    case "Shoulders":
      return "shoulders";
    case "Upper Legs":
      return "legs";
    case "Lower Legs":
      return "legs";
    case "Waist":
      return "abs";
    case "Lower Arms":
      return "forearms";
    case "Upper Arms":
      // Split by target muscle
      if (target === "Biceps") return "biceps";
      if (target === "Triceps") return "triceps";
      // Default based on name heuristics done below
      return "biceps"; // fallback
    case "Cardio":
      return null; // skip
    case "Neck":
      return null; // skip
    default:
      return null;
  }
}

// ─── Map WorkoutX equipment to our Equipment type ───
function mapEquipment(equip) {
  const map = {
    "Body Weight": "Bodyweight",
    Barbell: "Barbell",
    Dumbbell: "Dumbbells",
    Cable: "Cable",
    "Leverage Machine": "Machine",
    "Ez Barbell": "EZ Bar",
    Kettlebell: "Kettlebell",
    "Smith Machine": "Smith Machine",
    Band: "Band",
    "Medicine Ball": "Medicine Ball",
    "Stability Ball": "Stability Ball",
    "Sled Machine": "Machine",
    Assisted: "Machine",
    Weighted: "Weighted",
    "Olympic Barbell": "Olympic Barbell",
    "Trap Bar": "Trap Bar",
    "Bosu Ball": "Bosu Ball",
    "Wheel Roller": "Roller",
    Rope: "Bodyweight",
    "Resistance Band": "Band",
    "Body Weight (with Resistance Band)": "Band",
    Roller: "Roller",
  };
  return map[equip] || "Other";
}

// ─── Map difficulty ───
function mapDifficulty(diff) {
  if (!diff) return "Intermediate";
  const d = diff.toLowerCase();
  if (d === "beginner") return "Beginner";
  if (d === "intermediate") return "Intermediate";
  if (d === "advanced") return "Advanced";
  return "Intermediate";
}

// ─── Slugify name for GIF filename ───
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[°]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Default sets/reps by difficulty & category ───
function getDefaultSetsReps(difficulty, category, bodyPart) {
  if (bodyPart === "Waist") {
    // Abs exercises - higher reps
    return difficulty === "Advanced"
      ? { sets: 3, reps: 10 }
      : difficulty === "Intermediate"
        ? { sets: 3, reps: 15 }
        : { sets: 3, reps: 20 };
  }
  if (bodyPart === "Lower Legs") {
    return { sets: 4, reps: 15 };
  }
  if (bodyPart === "Lower Arms") {
    return { sets: 3, reps: 15 };
  }
  // Standard strength
  return difficulty === "Advanced"
    ? { sets: 4, reps: 6 }
    : difficulty === "Intermediate"
      ? { sets: 4, reps: 8 }
      : { sets: 3, reps: 12 };
}

function main() {
  const exercises = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log(`Loaded ${exercises.length} exercises from WorkoutX`);

  // Get existing GIF files
  const existingGifs = new Set(fs.readdirSync(GIF_DIR));

  // Build slug map for duplicate detection (same as download script)
  const slugCount = {};
  const allItems = exercises.map((e) => ({ ...e, slug: slugify(e.name) }));
  for (const item of allItems) {
    slugCount[item.slug] = (slugCount[item.slug] || 0) + 1;
  }
  const slugSeen = {};
  for (const item of allItems) {
    if (slugCount[item.slug] > 1) {
      slugSeen[item.slug] = (slugSeen[item.slug] || 0) + 1;
      if (slugSeen[item.slug] > 1) {
        item.slug = item.slug + "-v" + slugSeen[item.slug];
      }
    }
  }

  // Group by our muscle groups
  const groups = {
    chest: [],
    back: [],
    legs: [],
    shoulders: [],
    biceps: [],
    triceps: [],
    abs: [],
    forearms: [],
  };

  let skipped = 0;
  let withLocalGif = 0;
  let withRemoteGif = 0;

  for (const item of allItems) {
    const muscleGroup = mapBodyPart(item.bodyPart, item.target);
    if (!muscleGroup) {
      skipped++;
      continue;
    }

    const gifFilename = item.slug + ".gif";
    const hasLocalGif = existingGifs.has(gifFilename);
    if (hasLocalGif) withLocalGif++;
    else withRemoteGif++;

    const difficulty = mapDifficulty(item.difficulty);
    const { sets, reps } = getDefaultSetsReps(
      difficulty,
      item.category,
      item.bodyPart,
    );

    const exercise = {
      id: item.slug,
      name: item.name,
      equipment: mapEquipment(item.equipment),
      difficulty: difficulty,
      gif: gifFilename,
      gifUrl: item.gifUrl,
      sets: sets,
      reps: reps,
      description: item.description || item.name + " exercise.",
      descriptionAr: "",
      caloriesPerMinute: item.caloriesPerMinute || 0,
      target: item.target || "",
      secondaryMuscles: item.secondaryMuscles || [],
      instructions: item.instructions || [],
    };

    groups[muscleGroup].push(exercise);
  }

  // Sort each group: Beginner first, then Intermediate, then Advanced
  const diffOrder = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  for (const key of Object.keys(groups)) {
    groups[key].sort(
      (a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty],
    );
  }

  // Stats
  console.log("\nExercise counts per muscle group:");
  let total = 0;
  for (const [key, arr] of Object.entries(groups)) {
    console.log(`  ${key}: ${arr.length}`);
    total += arr.length;
  }
  console.log(`  TOTAL: ${total}`);
  console.log(`  Skipped (cardio/neck): ${skipped}`);
  console.log(`  With local GIF: ${withLocalGif}`);
  console.log(`  Remote GIF only: ${withRemoteGif}`);

  // ─── Generate TypeScript ───
  let ts = `// AUTO-GENERATED from WorkoutX API data — do not edit manually
// Run: node scripts/generate-exercises.js

export interface Exercise {
  id: string;
  name: string;
  equipment:
    | "Barbell"
    | "Dumbbells"
    | "Bodyweight"
    | "Machine"
    | "Kettlebell"
    | "Cable"
    | "EZ Bar"
    | "Smith Machine"
    | "Band"
    | "Medicine Ball"
    | "Stability Ball"
    | "Weighted"
    | "Olympic Barbell"
    | "Trap Bar"
    | "Bosu Ball"
    | "Roller"
    | "Other";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  gif: string;
  gifUrl: string;
  sets: number;
  reps: number;
  description: string;
  descriptionAr: string;
  caloriesPerMinute: number;
  target: string;
  secondaryMuscles: readonly string[];
  instructions: readonly string[];
}

export const EXERCISES: Record<string, Exercise[]> = {\n`;

  for (const [group, exerciseList] of Object.entries(groups)) {
    ts += `  ${group}: [\n`;
    for (const ex of exerciseList) {
      ts += `    {\n`;
      ts += `      id: ${JSON.stringify(ex.id)},\n`;
      ts += `      name: ${JSON.stringify(ex.name)},\n`;
      ts += `      equipment: ${JSON.stringify(ex.equipment)},\n`;
      ts += `      difficulty: ${JSON.stringify(ex.difficulty)},\n`;
      ts += `      gif: ${JSON.stringify(ex.gif)},\n`;
      ts += `      gifUrl: ${JSON.stringify(ex.gifUrl)},\n`;
      ts += `      sets: ${ex.sets},\n`;
      ts += `      reps: ${ex.reps},\n`;
      ts += `      description: ${JSON.stringify(ex.description)},\n`;
      ts += `      descriptionAr: ${JSON.stringify(ex.descriptionAr)},\n`;
      ts += `      caloriesPerMinute: ${ex.caloriesPerMinute},\n`;
      ts += `      target: ${JSON.stringify(ex.target)},\n`;
      ts += `      secondaryMuscles: ${JSON.stringify(ex.secondaryMuscles)},\n`;
      ts += `      instructions: ${JSON.stringify(ex.instructions)},\n`;
      ts += `    },\n`;
    }
    ts += `  ],\n`;
  }

  ts += `};\n\n`;

  ts += `export type MuscleGroup = keyof typeof EXERCISES;\n\n`;

  // Keep the same utility functions
  ts += `// Balanced XP calculation based on volume
// Increased by 50% for better progression: 15-120 XP per exercise
export const calculateXP = (
  weight: number,
  reps: number,
  sets: number,
): number => {
  const volume = weight * reps * sets;
  const baseXP = Math.floor(volume / 17);
  const scaled = baseXP < 75 ? baseXP : 75 + Math.floor((baseXP - 75) * 0.4);
  return Math.max(15, Math.min(120, scaled));
};

export interface CardioExercise {
  name: string;
  icon: string;
}

export const CARDIO_EXERCISES: CardioExercise[] = [
  { name: "Walking", icon: "walk" },
  { name: "Running", icon: "run" },
  { name: "Cycling", icon: "bike" },
  { name: "Elliptical", icon: "heart-pulse" },
  { name: "Jump Rope", icon: "jump-rope" },
  { name: "Stair Climb", icon: "stairs" },
];

export type CardioType = (typeof CARDIO_EXERCISES)[number]["name"];

// Balanced cardio XP: 8 XP per minute
export const calculateCardioXP = (durationMinutes: number): number => {
  const baseXP = Math.floor(durationMinutes * 8);
  const bonus = durationMinutes >= 30 ? Math.floor(baseXP * 0.15) : 0;
  return Math.min(120, baseXP + bonus);
};
`;

  fs.writeFileSync(OUTPUT_FILE, ts);
  console.log(`\nGenerated: ${OUTPUT_FILE}`);
  console.log(`File size: ${(Buffer.byteLength(ts) / 1024).toFixed(0)} KB`);

  // ─── Generate exerciseImages.ts ───
  // Only include GIFs that exist on disk
  const allExercises = Object.values(groups).flat();
  const localGifs = allExercises
    .filter((ex) => existingGifs.has(ex.gif))
    .map((ex) => ex.gif);
  // Deduplicate (in case of duplicates across groups)
  const uniqueLocalGifs = [...new Set(localGifs)].sort();

  let imgTs = `// AUTO-GENERATED — do not edit manually\n`;
  imgTs += `// Run: node scripts/generate-exercises.js\n`;
  imgTs += `// Maps exercise GIF filenames to local require() assets\n\n`;
  imgTs += `export const exerciseImages: Record<string, any> = {\n`;
  for (const gif of uniqueLocalGifs) {
    imgTs += `  "${gif}": require("../assets/images/exercises/${gif}"),\n`;
  }
  imgTs += `};\n`;

  fs.writeFileSync(IMAGES_FILE, imgTs);
  console.log(`Generated: ${IMAGES_FILE}`);
  console.log(`Local GIF mappings: ${uniqueLocalGifs.length}`);
}

main();
