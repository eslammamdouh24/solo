export interface StretchingExercise {
  name: string;
  duration: number; // in seconds
  icon: string;
  muscleGroup: string;
}

export const STRETCHING_EXERCISES: StretchingExercise[] = [
  {
    name: "Hamstring Stretch",
    duration: 30,
    icon: "human-handsdown",
    muscleGroup: "legs",
  },
  { name: "Quad Stretch", duration: 30, icon: "human", muscleGroup: "legs" },
  { name: "Calf Stretch", duration: 30, icon: "walk", muscleGroup: "legs" },
  { name: "Hip Flexor", duration: 30, icon: "yoga", muscleGroup: "legs" },
  {
    name: "Chest Stretch",
    duration: 30,
    icon: "arm-flex",
    muscleGroup: "chest",
  },
  {
    name: "Shoulder Stretch",
    duration: 30,
    icon: "hand-back-right",
    muscleGroup: "shoulders",
  },
  {
    name: "Triceps Stretch",
    duration: 30,
    icon: "arm-flex-outline",
    muscleGroup: "arms",
  },
  { name: "Back Stretch", duration: 30, icon: "yoga", muscleGroup: "back" },
  { name: "Neck Stretch", duration: 20, icon: "head", muscleGroup: "neck" },
  {
    name: "Oblique Stretch",
    duration: 30,
    icon: "human-handsup",
    muscleGroup: "abs",
  },
];

export type StretchingType = (typeof STRETCHING_EXERCISES)[number]["name"];

// Balanced stretching XP calculation
export const calculateStretchingXP = (durationSeconds: number): number => {
  // 0.5 XP per 15 seconds (reduced for balance)
  const baseXP = Math.floor((durationSeconds / 15) * 0.5);
  return Math.max(1, Math.min(4, baseXP)); // 1-4 XP range
};

// Calculate flexibility/recovery bonus
export const calculateFlexibilityBonus = (flexibility: number): number => {
  // Each point of flexibility gives 1% recovery bonus
  return 1 + flexibility * 0.01;
};
