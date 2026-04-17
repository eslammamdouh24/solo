#!/usr/bin/env node
/**
 * Curate exercises: Pick the best ~15-25 per muscle group from the full WorkoutX data.
 * Prioritizes exercises that have local GIFs.
 * Generates exercises.ts and exerciseImages.ts
 */

const fs = require("fs");
const path = require("path");

const GIF_DIR = path.join(__dirname, "..", "assets", "images", "exercises");
const EXERCISES_FILE = path.join(__dirname, "..", "constants", "exercises.ts");
const IMAGES_FILE = path.join(
  __dirname,
  "..",
  "constants",
  "exerciseImages.ts",
);

// Get all local GIFs
const localGifs = new Set(
  fs.readdirSync(GIF_DIR).filter((f) => f.endsWith(".gif")),
);
console.log(`Found ${localGifs.size} local GIFs`);

// Load all WorkoutX exercises
const allExercises = JSON.parse(
  fs.readFileSync("/tmp/workoutx-all.json", "utf-8"),
);
console.log(`Loaded ${allExercises.length} WorkoutX exercises`);

// Curated exercise IDs per muscle group — the best, most popular exercises
// These are hand-picked for a fitness app
const CURATED = {
  chest: [
    // Compound
    "barbell-bench-press",
    "barbell-incline-bench-press",
    "barbell-decline-bench-press",
    "barbell-close-grip-bench-press",
    "barbell-guillotine-bench-press",
    // Dumbbell
    "dumbbell-incline-fly",
    "dumbbell-pullover",
    "dumbbell-around-pullover",
    // Cable/Machine
    "cable-cross-over-variation",
    "chest-fly",
    "cable-standing-fly",
    "lever-chest-press",
    // Bodyweight
    "push-up",
    "diamond-push-up",
    "dips",
    "decline-push-up",
    "wide-push-up",
    "incline-push-up",
    // Other
    "assisted-chest-dip-kneeling",
    "bench-press",
    "incline-press",
    "decline-press",
  ],
  back: [
    // Barbell
    "barbell-bent-over-row",
    "barbell-reverse-grip-bent-over-row",
    "barbell-deadlift",
    "barbell-rack-pull",
    "barbell-incline-row",
    "barbell-pullover",
    // Dumbbell
    "dumbbell-bent-over-row",
    "dumbbell-shrug",
    // Cable/Machine
    "lat-pulldown",
    "cable-seated-row",
    "straight-arm-pulldown",
    "t-bar-row",
    // Bodyweight
    "pull-up",
    "chin-up",
    "inverted-row",
    "assisted-pull-up",
    // Other
    "cable-rear-delt-row",
    "reverse-fly",
    "cable-rear-delt-row-stirrups",
    "dumbbell-one-arm-bent-over-row",
    "cable-low-seated-row",
  ],
  legs: [
    // Squat variations
    "squat",
    "barbell-full-squat",
    "barbell-front-squat",
    "goblet-squat",
    "barbell-hack-squat",
    "barbell-overhead-squat",
    "barbell-narrow-stance-squat",
    "barbell-sumo-squat",
    "barbell-jump-squat",
    // Lunge
    "barbell-lunge",
    "barbell-rear-lunge",
    "dumbbell-lunge",
    "lunges",
    "dumbbell-single-leg-split-squat",
    // Hip/Glute
    "deadlift",
    "romanian-deadlift",
    "hip-thrust",
    "barbell-good-morning",
    // Machine/Isolation
    "leg-press",
    "leg-extension",
    "hamstring-curl",
    "calf-raise",
    // Machine/Other
    "hip-abduction",
    "hip-adduction",
    "smith-squat",
    // Other
    "barbell-jefferson-squat",
    "barbell-bench-squat",
  ],
  shoulders: [
    // Press
    "shoulder-press",
    "barbell-seated-behind-head-military-press",
    "arnold-press",
    "cable-shoulder-press",
    "barbell-clean-and-press",
    "lever-military-press",
    // Raise
    "lateral-raise",
    "front-raise",
    "cable-lateral-raise",
    "barbell-front-raise",
    "barbell-rear-delt-raise",
    // Pull
    "upright-row",
    "reverse-fly",
    // Other
    "barbell-incline-shoulder-raise",
    "rear-delt-row",
  ],
  biceps: [
    // Barbell
    "barbell-curl",
    "barbell-drag-curl",
    "barbell-preacher-curl",
    "barbell-prone-incline-curl",
    // Dumbbell
    "biceps-curl",
    "hammer-curl",
    "concentration-curl",
    "dumbbell-incline-biceps-curl",
    "spider-curl",
    "dumbbell-incline-curl",
    // Cable
    "cable-curl",
    // Other
    "chin-up",
    "drag-curl",
    "preacher-curl",
    "reverse-curl",
  ],
  triceps: [
    // Barbell
    "barbell-lying-triceps-extension",
    "barbell-lying-close-grip-press",
    "skull-crusher",
    "close-grip-bench-press",
    "barbell-lying-triceps-extension-skull-crusher",
    // Dumbbell
    "dumbbell-standing-alternating-tricep-kickback",
    "lying-triceps-extension",
    "barbell-standing-overhead-triceps-extension",
    "dumbbell-kickback",
    "cable-overhead-triceps-extension-rope-attachment",
    // Cable
    "triceps-pushdown",
    "reverse-grip-pushdown",
    // Bodyweight
    "dips",
    "diamond-push-up",
    "bench-dip",
    // Other
    "assisted-triceps-dip-kneeling",
  ],
  abs: [
    // Crunch variations
    "crunches",
    "bicycle-crunches",
    "reverse-crunch",
    // Leg raise
    "lying-leg-raise-flat-bench",
    "hanging-leg-raise",
    "flutter-kicks",
    // Plank
    "plank",
    "side-plank",
    "mountain-climber",
    // Twist/Rotation
    "russian-twist",
    // Other
    "air-bike",
    "45-side-bend",
    "3-4-sit-up",
    "barbell-press-sit-up",
    "assisted-hanging-knee-raise",
    "hanging-leg-raise",
  ],
  forearms: [
    // Wrist curls
    "barbell-wrist-curl",
    "barbell-reverse-wrist-curl",
    "barbell-standing-back-wrist-curl",
    // Grip
    "reverse-curl",
    "farmers-walk",
    // Other
    "wrist-circles",
  ],
};

// Body part mapping from WorkoutX
const BODY_PART_MAP = {
  chest: "chest",
  back: "back",
  "upper legs": "legs",
  "lower legs": "legs",
  shoulders: "shoulders",
  "upper arms": null, // split by target
  waist: "abs",
  "lower arms": "forearms",
};

function getSlug(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapEquipment(eq) {
  const map = {
    barbell: "Barbell",
    dumbbell: "Dumbbells",
    "body weight": "Bodyweight",
    cable: "Cable",
    "leverage machine": "Machine",
    "smith machine": "Smith Machine",
    band: "Band",
    kettlebell: "Kettlebell",
    "ez barbell": "EZ Bar",
    "medicine ball": "Medicine Ball",
    "stability ball": "Stability Ball",
    weighted: "Weighted",
    "olympic barbell": "Olympic Barbell",
    "trap bar": "Trap Bar",
    "bosu ball": "Bosu Ball",
    roller: "Roller",
    "sled machine": "Machine",
    assisted: "Machine",
    "resistance band": "Band",
  };
  return map[eq.toLowerCase()] || "Other";
}

function mapDifficulty(d) {
  if (!d) return "Intermediate";
  const l = d.toLowerCase();
  if (l === "beginner") return "Beginner";
  if (l === "intermediate") return "Intermediate";
  if (l === "advanced" || l === "expert") return "Advanced";
  return "Intermediate";
}

function getMuscleGroup(ex) {
  const bp = ex.bodyPart?.toLowerCase();
  if (bp === "upper arms") {
    const target = ex.target?.toLowerCase() || "";
    if (target.includes("bicep")) return "biceps";
    if (target.includes("tricep")) return "triceps";
    return "biceps";
  }
  return BODY_PART_MAP[bp] || null;
}

function estimateCalories(ex, group) {
  const eq = (ex.equipment || "").toLowerCase();
  const name = (ex.name || "").toLowerCase();

  // Compound barbell movements burn most
  if (
    name.includes("deadlift") ||
    name.includes("squat") ||
    name.includes("clean")
  )
    return 10;
  if (
    name.includes("bench press") ||
    name.includes("overhead press") ||
    name.includes("military press")
  )
    return 8;
  if (
    name.includes("row") ||
    name.includes("pull-up") ||
    name.includes("chin-up") ||
    name.includes("dip")
  )
    return 7;
  if (name.includes("lunge") || name.includes("thrust")) return 9;

  // By muscle group
  if (group === "legs") return eq === "body weight" ? 7 : 9;
  if (group === "back") return eq === "body weight" ? 6 : 7;
  if (group === "chest") return eq === "body weight" ? 6 : 7;
  if (group === "shoulders") return 6;
  if (group === "abs") return 5;
  if (group === "biceps" || group === "triceps") return 5;
  if (group === "forearms") return 3;
  return 5;
}

function getSetsReps(ex, group) {
  const name = (ex.name || "").toLowerCase();
  const eq = (ex.equipment || "").toLowerCase();

  // Compound heavy lifts: fewer reps
  if (name.includes("deadlift") || (name.includes("squat") && eq === "barbell"))
    return { sets: 4, reps: 8 };
  if (name.includes("bench press") && !name.includes("close"))
    return { sets: 4, reps: 8 };
  if (name.includes("overhead press") || name.includes("military press"))
    return { sets: 4, reps: 8 };
  if (name.includes("clean") || name.includes("snatch"))
    return { sets: 3, reps: 6 };
  if (name.includes("hack squat") || name.includes("front squat"))
    return { sets: 4, reps: 8 };

  // Compound medium: moderate reps
  if (
    name.includes("row") ||
    name.includes("pull-up") ||
    name.includes("chin-up")
  )
    return { sets: 3, reps: 10 };
  if (name.includes("dip") || name.includes("lunge"))
    return { sets: 3, reps: 10 };
  if (name.includes("press") && !name.includes("leg"))
    return { sets: 3, reps: 10 };
  if (name.includes("pulldown") || name.includes("pull down"))
    return { sets: 3, reps: 10 };
  if (name.includes("thrust")) return { sets: 3, reps: 10 };

  // Machine/cable: moderate-high reps
  if (eq === "cable" || eq === "leverage machine") return { sets: 3, reps: 12 };

  // Isolation: higher reps
  if (
    name.includes("curl") ||
    name.includes("raise") ||
    name.includes("fly") ||
    name.includes("extension")
  )
    return { sets: 3, reps: 12 };
  if (name.includes("kickback") || name.includes("pushdown"))
    return { sets: 3, reps: 12 };
  if (name.includes("shrug")) return { sets: 3, reps: 15 };

  // Abs/core: high reps
  if (group === "abs") return { sets: 3, reps: 15 };
  if (group === "forearms") return { sets: 3, reps: 15 };

  // Bodyweight
  if (eq === "body weight") {
    if (name.includes("push-up") || name.includes("push up"))
      return { sets: 3, reps: 15 };
    if (name.includes("plank") || name.includes("mountain"))
      return { sets: 3, reps: 30 }; // seconds
    return { sets: 3, reps: 12 };
  }

  return { sets: 3, reps: 12 };
}

// Import Arabic instruction translator
const { translateInstructionsToAr } = require("./instruction-translations");

// Arabic exercise name/description generator
const EQUIPMENT_AR = {
  Barbell: "بار حديد",
  Dumbbells: "دمبل",
  Bodyweight: "وزن الجسم",
  Machine: "جهاز",
  Kettlebell: "كيتل بيل",
  Cable: "كابل",
  "EZ Bar": "بار EZ",
  "Smith Machine": "سميث ماشين",
  Band: "حبل مقاومة",
  "Medicine Ball": "كرة طبية",
  "Stability Ball": "كرة توازن",
  Weighted: "بأوزان",
  "Olympic Barbell": "بار أولمبي",
  "Trap Bar": "تراب بار",
  "Bosu Ball": "كرة بوسو",
  Roller: "رولر",
  Other: "أخرى",
};

const DIFFICULTY_AR = {
  Beginner: "مبتدئ",
  Intermediate: "متوسط",
  Advanced: "متقدم",
};

const MUSCLE_AR = {
  chest: "الصدر",
  back: "الظهر",
  legs: "الأرجل",
  shoulders: "الأكتاف",
  biceps: "الباي",
  triceps: "التراي",
  abs: "البطن",
  forearms: "الساعد",
  pectorals: "عضلات الصدر",
  lats: "عضلات الظهر العريضة",
  "upper back": "أعلى الظهر",
  traps: "الترابيس",
  quads: "الفخذ الأمامي",
  quadriceps: "الفخذ الأمامي",
  hamstrings: "الفخذ الخلفي",
  glutes: "المؤخرة",
  calves: "السمانة",
  delts: "الدالية",
  "anterior deltoids": "الدالية الأمامية",
  "lateral deltoids": "الدالية الجانبية",
  "posterior deltoids": "الدالية الخلفية",
  "biceps brachii": "عضلة الباي",
  "triceps brachii": "عضلة التراي",
  "forearm flexors": "عضلات الساعد",
  "forearm extensors": "باسطات الساعد",
  abs: "البطن",
  obliques: "العضلات الجانبية",
  core: "الجذع",
  "hip flexors": "عضلات الورك",
  "lower back": "أسفل الظهر",
  rhomboids: "عضلات الروم بويد",
  "serratus anterior": "العضلة المنشارية",
  brachialis: "العضلة العضدية",
  brachioradialis: "عضلة الساعد",
  "levator scapulae": "رافعة الكتف",
};

function getTargetAr(target) {
  if (!target) return "";
  return MUSCLE_AR[target.toLowerCase()] || target;
}

function generateArabicDescription(ex, group, equipment) {
  const groupAr = MUSCLE_AR[group] || group;
  const eqAr = EQUIPMENT_AR[equipment] || equipment;
  const diffAr =
    DIFFICULTY_AR[
      ex.difficulty
        ? ex.difficulty.charAt(0).toUpperCase() +
          ex.difficulty.slice(1).toLowerCase()
        : "Intermediate"
    ] || "متوسط";
  const targetAr = getTargetAr(ex.target);

  let desc = `تمرين ${ex.name} هو تمرين ${diffAr} يستهدف ${targetAr || groupAr}`;
  desc += ` باستخدام ${eqAr}.`;

  if (ex.secondaryMuscles && ex.secondaryMuscles.length > 0) {
    const secAr = ex.secondaryMuscles
      .map((m) => MUSCLE_AR[m.toLowerCase()] || m)
      .join(" و");
    desc += ` العضلات المساعدة: ${secAr}.`;
  }

  return desc;
}

// Gender classification for exercises
// "male" = primarily male-focused, "female" = primarily female-focused, "both" = universal
const FEMALE_EXERCISES = new Set([
  "hip-thrust",
  "barbell-good-morning",
  "romanian-deadlift",
  "goblet-squat",
  "dumbbell-single-leg-split-squat",
  "lunges",
  "dumbbell-lunge",
  "barbell-rear-lunge",
  "barbell-sumo-squat",
  "hip-abduction",
  "hip-adduction",
  "cable-lateral-raise",
  "lateral-raise",
  "assisted-chest-dip-kneeling",
  "incline-push-up",
  "cable-curl",
  "reverse-fly",
  "assisted-pull-up",
  "inverted-row",
  "bicycle-crunches",
  "flutter-kicks",
  "plank",
  "side-plank",
  "mountain-climber",
  "russian-twist",
  "reverse-crunch",
  "lying-leg-raise-flat-bench",
]);

const MALE_EXERCISES = new Set([
  "barbell-bench-press",
  "barbell-incline-bench-press",
  "barbell-decline-bench-press",
  "barbell-guillotine-bench-press",
  "barbell-close-grip-bench-press",
  "barbell-bent-over-row",
  "barbell-reverse-grip-bent-over-row",
  "barbell-deadlift",
  "barbell-rack-pull",
  "t-bar-row",
  "barbell-full-squat",
  "barbell-front-squat",
  "barbell-hack-squat",
  "barbell-overhead-squat",
  "barbell-jefferson-squat",
  "barbell-bench-squat",
  "barbell-clean-and-press",
  "barbell-seated-behind-head-military-press",
  "barbell-curl",
  "barbell-drag-curl",
  "barbell-preacher-curl",
  "barbell-prone-incline-curl",
  "barbell-lying-triceps-extension",
  "skull-crusher",
  "close-grip-bench-press",
  "barbell-lying-triceps-extension-skull-crusher",
  "barbell-lying-close-grip-press",
  "barbell-wrist-curl",
  "barbell-reverse-wrist-curl",
  "barbell-standing-back-wrist-curl",
]);

function getGender(slug) {
  if (FEMALE_EXERCISES.has(slug)) return "female";
  if (MALE_EXERCISES.has(slug)) return "male";
  return "both";
}

// Build a lookup of all WorkoutX exercises by slug
const wxBySlug = new Map();
for (const ex of allExercises) {
  const slug = getSlug(ex.name);
  wxBySlug.set(slug, ex);
}

// Explicit overrides: curated slug → correct WorkoutX slug
// Fixes cases where partial matching picks the wrong exercise
const SLUG_TO_WX = {
  // Chest
  "chest-fly": "dumbbell-fly",
  dips: "chest-dip",
  "wide-push-up": "wide-hand-push-up",
  "bench-press": "dumbbell-bench-press",
  "incline-press": "dumbbell-incline-bench-press",
  "decline-press": "cable-decline-press",
  // Back
  "lat-pulldown": "cable-bar-lateral-pulldown",
  "straight-arm-pulldown": "cable-straight-arm-pulldown",
  "t-bar-row": "lever-t-bar-row",
  "cable-rear-delt-row": "cable-rear-delt-row-with-rope",
  "reverse-fly": "dumbbell-reverse-fly",
  // Legs
  squat: "barbell-full-squat",
  "goblet-squat": "dumbbell-goblet-squat",
  deadlift: "barbell-deadlift",
  "romanian-deadlift": "barbell-romanian-deadlift",
  "hip-thrust": "barbell-glute-bridge",
  "leg-press": "sled-45-leg-press",
  "leg-extension": "lever-leg-extension",
  "hamstring-curl": "lever-lying-leg-curl",
  "calf-raise": "lever-standing-calf-raise",
  "hip-abduction": "lever-seated-hip-abduction",
  "hip-adduction": "lever-seated-hip-adduction",
  "smith-squat": "smith-squat",
  "barbell-sumo-squat": "smith-sumo-squat",
  lunges: "dumbbell-lunge",
  // Shoulders
  "shoulder-press": "cable-shoulder-press",
  "arnold-press": "dumbbell-arnold-press",
  "lateral-raise": "dumbbell-lateral-raise",
  "front-raise": "barbell-front-raise",
  "upright-row": "barbell-upright-row",
  "rear-delt-row": "barbell-rear-delt-row",
  // Biceps
  "biceps-curl": "dumbbell-biceps-curl",
  "hammer-curl": "dumbbell-hammer-curl",
  "concentration-curl": "dumbbell-concentration-curl",
  "spider-curl": "ez-barbell-spider-curl",
  "drag-curl": "barbell-drag-curl",
  "preacher-curl": "barbell-preacher-curl",
  "reverse-curl": "barbell-reverse-curl",
  // Triceps
  "skull-crusher": "barbell-lying-triceps-extension-skull-crusher",
  "close-grip-bench-press": "barbell-close-grip-bench-press",
  "lying-triceps-extension": "barbell-lying-triceps-extension",
  "triceps-pushdown": "cable-triceps-pushdown-v-bar",
  "reverse-grip-pushdown": "cable-reverse-grip-pushdown",
  "bench-dip": "bench-dip-knees-bent",
  // Abs
  crunches: "crunch-floor",
  "bicycle-crunches": "band-bicycle-crunch",
  plank: "weighted-front-plank",
  "side-plank": "bodyweight-incline-side-plank",
};

// Build the curated exercise data
const result = {};
let totalCount = 0;
const usedGifs = new Set();

for (const [group, slugList] of Object.entries(CURATED)) {
  result[group] = [];

  for (const slug of slugList) {
    // Find in WorkoutX data — try override first, then exact, then partial
    let wx = null;
    if (SLUG_TO_WX[slug]) {
      wx = wxBySlug.get(SLUG_TO_WX[slug]);
    }
    if (!wx) {
      wx = wxBySlug.get(slug);
    }
    if (!wx) {
      // Try finding by partial match — prefer shortest key (most specific)
      let bestMatch = null;
      let bestLen = Infinity;
      for (const [key, val] of wxBySlug.entries()) {
        if (key.includes(slug) || slug.includes(key)) {
          if (key.length < bestLen) {
            bestMatch = val;
            bestLen = key.length;
          }
        }
      }
      wx = bestMatch;
    }

    const gifFile = slug + ".gif";
    const hasLocalGif = localGifs.has(gifFile);

    if (hasLocalGif) usedGifs.add(gifFile);

    if (wx) {
      // Build from WorkoutX data
      const equipment = mapEquipment(wx.equipment || "body weight");
      const { sets, reps } = getSetsReps(wx, group);
      const descriptionAr =
        wx.descriptionAr || generateArabicDescription(wx, group, equipment);
      const exercise = {
        id: slug,
        name: wx.name,
        equipment,
        difficulty: mapDifficulty(wx.difficulty),
        gender: getGender(slug),
        gif: gifFile,
        gifUrl: wx.gifUrl || "",
        sets,
        reps,
        description: wx.description || "",
        descriptionAr,
        caloriesPerMinute: estimateCalories(wx, group),
        target: wx.target || "",
        secondaryMuscles: wx.secondaryMuscles || [],
        instructions: wx.instructions || [],
        instructionsAr: translateInstructionsToAr(wx.instructions),
      };
      result[group].push(exercise);
    } else {
      // Build a basic entry (for exercises like "deadlift" that may have a different WorkoutX name)
      console.log(`  [WARN] No WorkoutX match for: ${slug} (group: ${group})`);
      const prettyName = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      const { sets, reps } = getSetsReps(
        { name: prettyName, equipment: "body weight" },
        group,
      );
      const fakeEx = {
        name: prettyName,
        target: group,
        secondaryMuscles: [],
        difficulty: "Intermediate",
      };
      result[group].push({
        id: slug,
        name: prettyName,
        equipment: "Bodyweight",
        difficulty: "Intermediate",
        gender: getGender(slug),
        gif: gifFile,
        gifUrl: "",
        sets,
        reps,
        description: "",
        descriptionAr: generateArabicDescription(fakeEx, group, "Bodyweight"),
        caloriesPerMinute: estimateCalories(
          { name: prettyName, equipment: "body weight" },
          group,
        ),
        target: "",
        secondaryMuscles: [],
        instructions: [],
        instructionsAr: [],
      });
    }
  }

  totalCount += result[group].length;
  console.log(
    `${group}: ${result[group].length} exercises (${result[group].filter((e) => localGifs.has(e.gif)).length} with local GIFs)`,
  );
}

console.log(`\nTotal: ${totalCount} curated exercises`);
console.log(`Local GIFs used: ${usedGifs.size}`);

// ─── Generate exercises.ts ───
function escStr(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

let ts = `// Curated exercise list — best exercises per muscle group
// Generated by: node scripts/curate-exercises.js

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
  gender: "male" | "female" | "both";
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
  instructionsAr: readonly string[];
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "abs"
  | "forearms";

export type CardioType =
  | "Walking"
  | "Running"
  | "Cycling"
  | "Elliptical"
  | "Jump Rope"
  | "Stair Climb";

export const CARDIO_EXERCISES = [
  { name: "Walking", icon: "walk", caloriesPerMinute: 4, xpMultiplier: 0.8 },
  { name: "Running", icon: "run", caloriesPerMinute: 10, xpMultiplier: 1.2 },
  { name: "Cycling", icon: "bike", caloriesPerMinute: 8, xpMultiplier: 1.0 },
  {
    name: "Elliptical",
    icon: "heart-pulse",
    caloriesPerMinute: 7,
    xpMultiplier: 0.9,
  },
  {
    name: "Jump Rope",
    icon: "jump-rope",
    caloriesPerMinute: 12,
    xpMultiplier: 1.3,
  },
  {
    name: "Stair Climb",
    icon: "stairs",
    caloriesPerMinute: 9,
    xpMultiplier: 1.1,
  },
];

export const calculateXP = (
  timeInSeconds: number,
  reps: number,
  sets: number,
): number => {
  const baseXP = Math.floor(timeInSeconds * 0.5 + reps * sets * 2);
  return Math.max(baseXP, 10);
};

export const calculateCardioXP = (durationMinutes: number): number => {
  return Math.floor(durationMinutes * 3);
};

export const EXERCISES: Record<MuscleGroup, Exercise[]> = {\n`;

for (const [group, exercises] of Object.entries(result)) {
  ts += `  ${group}: [\n`;
  for (const ex of exercises) {
    ts += `    {\n`;
    ts += `      id: "${escStr(ex.id)}",\n`;
    ts += `      name: "${escStr(ex.name)}",\n`;
    ts += `      equipment: "${ex.equipment}",\n`;
    ts += `      difficulty: "${ex.difficulty}",\n`;
    ts += `      gender: "${ex.gender}",\n`;
    ts += `      gif: "${escStr(ex.gif)}",\n`;
    ts += `      gifUrl: "${escStr(ex.gifUrl)}",\n`;
    ts += `      sets: ${ex.sets},\n`;
    ts += `      reps: ${ex.reps},\n`;
    ts += `      description:\n`;
    ts += `        "${escStr(ex.description)}",\n`;
    ts += `      descriptionAr:\n`;
    ts += `        "${escStr(ex.descriptionAr)}",\n`;
    ts += `      caloriesPerMinute: ${ex.caloriesPerMinute},\n`;
    ts += `      target: "${escStr(ex.target)}",\n`;
    ts += `      secondaryMuscles: [${ex.secondaryMuscles.map((m) => `"${escStr(m)}"`).join(", ")}],\n`;
    ts += `      instructions: [${ex.instructions.length > 0 ? "\n" + ex.instructions.map((i) => `        "${escStr(i)}"`).join(",\n") + ",\n      " : ""}],\n`;
    ts += `      instructionsAr: [${ex.instructionsAr && ex.instructionsAr.length > 0 ? "\n" + ex.instructionsAr.map((i) => `        "${escStr(i)}"`).join(",\n") + ",\n      " : ""}],\n`;
    ts += `    },\n`;
  }
  ts += `  ],\n`;
}

ts += `};\n`;

fs.writeFileSync(EXERCISES_FILE, ts);
console.log(`\nWrote ${EXERCISES_FILE}`);

// ─── Generate exerciseImages.ts ───
let imgTs = `// Local GIF require() mappings for curated exercises\n`;
imgTs += `// Generated by: node scripts/curate-exercises.js\n\n`;
imgTs += `export const exerciseImages: Record<string, any> = {\n`;

let imgCount = 0;
const addedImgs = new Set();
for (const exercises of Object.values(result)) {
  for (const ex of exercises) {
    if (localGifs.has(ex.gif) && !addedImgs.has(ex.gif)) {
      imgTs += `  "${ex.gif}": require("@/assets/images/exercises/${ex.gif}"),\n`;
      addedImgs.add(ex.gif);
      imgCount++;
    }
  }
}

imgTs += `};\n`;

fs.writeFileSync(IMAGES_FILE, imgTs);
console.log(`Wrote ${IMAGES_FILE} (${imgCount} mappings)`);

// Report unused GIFs
const unusedGifs = [...localGifs].filter((g) => !usedGifs.has(g));
console.log(`\nUnused GIFs (${unusedGifs.length}):`);
unusedGifs.forEach((g) => console.log(`  ${g}`));

// Write unused list for deletion
fs.writeFileSync("/tmp/unused-gifs.txt", unusedGifs.join("\n"));
console.log(`\nWrote /tmp/unused-gifs.txt`);
