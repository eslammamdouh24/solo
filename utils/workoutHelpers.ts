import { getDayDiff, getToday } from "./xpCalculations";

interface StreakPenaltyResult {
  xpLost: number;
  daysInactive: number;
  shouldApplyPenalty: boolean;
}

export const calculateStreakPenalty = (
  lastWorkoutDate: string | null,
  currentXP: number,
  currentLevel: number,
): StreakPenaltyResult => {
  if (!lastWorkoutDate) {
    return { xpLost: 0, daysInactive: 0, shouldApplyPenalty: false };
  }

  const today = getToday();
  const daysInactive = getDayDiff(today, lastWorkoutDate);

  // Apply penalty after 4 days of inactivity
  if (daysInactive >= 4) {
    // Lose 10% of current XP per day after 4 days, capped at 50%
    const penaltyPercentage = Math.min(0.1 * (daysInactive - 3), 0.5);
    const xpLost = Math.floor(currentXP * penaltyPercentage);

    return {
      xpLost,
      daysInactive,
      shouldApplyPenalty: true,
    };
  }

  return { xpLost: 0, daysInactive, shouldApplyPenalty: false };
};

// Pure function to calculate new streak value
export const calculateNewStreak = (
  lastWorkoutDate: string | null,
  currentStreak: number,
): number => {
  const today = getToday();
  if (!lastWorkoutDate) return 1;
  const diff = getDayDiff(today, lastWorkoutDate);
  if (diff === 0) return currentStreak; // Same day
  if (diff === 1) return currentStreak + 1;
  return 1; // Streak broken
};

interface StatUpdateParams {
  muscleGroup: string;
  setStrength: (updater: (prev: number) => number) => void;
  setEndurance: (updater: (prev: number) => number) => void;
  setDiscipline: (updater: (prev: number) => number) => void;
}

import { ActivityGroup } from "@/constants/enums";

// Pure function to get stat gains for a workout
export const getStatGains = (
  muscleGroup: string,
): { strength: number; endurance: number; discipline: number } => {
  switch (muscleGroup) {
    case ActivityGroup.CHEST:
    case ActivityGroup.BACK:
      return { strength: 2, endurance: 0, discipline: 1 };
    case ActivityGroup.LEGS:
      return { strength: 2, endurance: 1, discipline: 1 };
    case ActivityGroup.SHOULDERS:
    case ActivityGroup.BICEPS:
    case ActivityGroup.TRICEPS:
    case ActivityGroup.FOREARMS:
      return { strength: 1, endurance: 0, discipline: 1 };
    case ActivityGroup.ABS:
      return { strength: 1, endurance: 1, discipline: 2 };
    case ActivityGroup.CARDIO:
      return { strength: 0, endurance: 2, discipline: 1 };
    case ActivityGroup.STRETCHING:
      return { strength: 0, endurance: 1, discipline: 1 };
    default:
      return { strength: 1, endurance: 0, discipline: 1 };
  }
};

// Balanced stat gains based on major muscle groups
// Matches proper strength training: chest, back, legs, shoulders, arms, core
export const updateStatsForWorkout = ({
  muscleGroup,
  setStrength,
  setEndurance,
  setDiscipline,
}: StatUpdateParams): void => {
  // Major compound movements (chest, back, legs)
  if (muscleGroup === ActivityGroup.CHEST) {
    setStrength((prev) => prev + 2);
    setDiscipline((prev) => prev + 1);
  } else if (muscleGroup === ActivityGroup.BACK) {
    setStrength((prev) => prev + 2);
    setDiscipline((prev) => prev + 1);
  } else if (muscleGroup === ActivityGroup.LEGS) {
    setStrength((prev) => prev + 2);
    setEndurance((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  }
  // Upper body isolation (shoulders, biceps, triceps)
  else if (muscleGroup === ActivityGroup.SHOULDERS) {
    setStrength((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  } else if (muscleGroup === ActivityGroup.BICEPS) {
    setStrength((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  } else if (muscleGroup === ActivityGroup.TRICEPS) {
    setStrength((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  }
  // Abs
  else if (muscleGroup === ActivityGroup.ABS) {
    setStrength((prev) => prev + 1);
    setEndurance((prev) => prev + 1);
    setDiscipline((prev) => prev + 2);
  }
  // Cardio
  else if (muscleGroup === ActivityGroup.CARDIO) {
    setEndurance((prev) => prev + 2);
    setDiscipline((prev) => prev + 1);
  }
  // Stretching bonus (small recovery benefit)
  else if (muscleGroup === ActivityGroup.STRETCHING) {
    setEndurance((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  }
};
