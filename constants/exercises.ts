export interface Exercise {
  name: string;
  multiplier: number;
}

export const EXERCISES = {
  chest: [
    { name: "Bench Press", multiplier: 1.2 },
    { name: "Incline Press", multiplier: 1.1 },
    { name: "Chest Fly", multiplier: 0.9 },
    { name: "Dips", multiplier: 1.1 },
  ],
  back: [
    { name: "Pull Up", multiplier: 1.4 },
    { name: "Barbell Row", multiplier: 1.2 },
    { name: "Deadlift", multiplier: 1.5 },
    { name: "Lat Pulldown", multiplier: 1.0 },
  ],
  legs: [
    { name: "Squat", multiplier: 1.5 },
    { name: "Leg Press", multiplier: 1.3 },
    { name: "Lunges", multiplier: 1.0 },
    { name: "Hip Thrust", multiplier: 1.4 },
    { name: "Bulgarian Split Squat", multiplier: 1.2 },
  ],
  shoulders: [
    { name: "Shoulder Press", multiplier: 1.1 },
    { name: "Lateral Raise", multiplier: 0.9 },
    { name: "Front Raise", multiplier: 0.9 },
  ],
  biceps: [
    { name: "Biceps Curl", multiplier: 0.8 },
    { name: "Hammer Curl", multiplier: 0.8 },
    { name: "Preacher Curl", multiplier: 0.8 },
  ],
  triceps: [
    { name: "Triceps Pushdown", multiplier: 0.8 },
    { name: "Skull Crusher", multiplier: 0.9 },
    { name: "Overhead Extension", multiplier: 0.8 },
  ],
  abs: [
    { name: "Crunches", multiplier: 0.7 },
    { name: "Plank", multiplier: 0.8 },
    { name: "Leg Raises", multiplier: 0.9 },
  ],
} as const;

export type MuscleGroup = keyof typeof EXERCISES;

// Balanced XP calculation based on volume (Option C)
// Increased by 50% for better progression: 15-120 XP per exercise
export const calculateXP = (
  weight: number,
  reps: number,
  sets: number,
): number => {
  // Calculate total volume
  const volume = weight * reps * sets;

  // Base XP: 1 XP per 17 units of volume (increased from 25)
  const baseXP = Math.floor(volume / 17);

  // Progressive scaling: gentler diminishing returns
  const scaled = baseXP < 75 ? baseXP : 75 + Math.floor((baseXP - 75) * 0.4);

  // Cap at higher values (15-120 XP per exercise)
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

// Balanced cardio XP: 8 XP per minute (Option C - increased from 3)
export const calculateCardioXP = (durationMinutes: number): number => {
  const baseXP = Math.floor(durationMinutes * 8); // 8 XP per minute

  // Bonus for longer sessions (endurance training)
  const bonus = durationMinutes >= 30 ? Math.floor(baseXP * 0.15) : 0;

  return Math.min(120, baseXP + bonus); // Cap at 120 XP
};
