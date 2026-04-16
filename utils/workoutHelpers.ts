import { getDayDiff, getToday } from "./xpCalculations";

interface StreakUpdateParams {
  lastWorkoutDate: string | null;
  currentStreak: number;
  setCurrentStreak: (value: number) => void;
  setLastWorkoutDate: (value: string) => void;
}

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

export const updateStreak = ({
  lastWorkoutDate,
  currentStreak,
  setCurrentStreak,
  setLastWorkoutDate,
}: StreakUpdateParams): void => {
  const today = getToday();

  if (!lastWorkoutDate) {
    setCurrentStreak(1);
    setLastWorkoutDate(today);
    return;
  }

  const diff = getDayDiff(today, lastWorkoutDate);

  if (diff === 0) return; // Same day - no change

  if (diff === 1) {
    setCurrentStreak(currentStreak + 1);
  } else {
    setCurrentStreak(1);
  }

  setLastWorkoutDate(today);
};

interface StatUpdateParams {
  muscleGroup: string;
  setStrength: (updater: (prev: number) => number) => void;
  setEndurance: (updater: (prev: number) => number) => void;
  setDiscipline: (updater: (prev: number) => number) => void;
}

// Balanced stat gains based on major muscle groups
// Matches proper strength training: chest, back, legs, shoulders, arms, core
export const updateStatsForWorkout = ({
  muscleGroup,
  setStrength,
  setEndurance,
  setDiscipline,
}: StatUpdateParams): void => {
  // Major compound movements (chest, back, legs)
  if (muscleGroup === "chest") {
    setStrength((prev) => prev + 2);
    setDiscipline((prev) => prev + 1);
  } else if (muscleGroup === "back") {
    setStrength((prev) => prev + 2);
    setDiscipline((prev) => prev + 1);
  } else if (muscleGroup === "legs") {
    setStrength((prev) => prev + 2);
    setEndurance((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  }
  // Upper body isolation (shoulders, biceps, triceps)
  else if (muscleGroup === "shoulders") {
    setStrength((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  } else if (muscleGroup === "biceps") {
    setStrength((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  } else if (muscleGroup === "triceps") {
    setStrength((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  }
  // Abs
  else if (muscleGroup === "abs") {
    setStrength((prev) => prev + 1);
    setEndurance((prev) => prev + 1);
    setDiscipline((prev) => prev + 2);
  }
  // Cardio
  else if (muscleGroup === "cardio") {
    setEndurance((prev) => prev + 2);
    setDiscipline((prev) => prev + 1);
  }
  // Stretching bonus (small recovery benefit)
  else if (muscleGroup === "stretching") {
    setEndurance((prev) => prev + 1);
    setDiscipline((prev) => prev + 1);
  }
};
