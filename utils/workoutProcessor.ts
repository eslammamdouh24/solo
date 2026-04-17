import { Language, t } from "@/constants/translations";
import {
  applyStreakMultiplier,
  calculateStatBonus,
  DAILY_BONUS,
  getRequiredXP,
  getToday,
  safeNumber,
} from "./xpCalculations";

// Quality multiplier system for random workout quality
export const getQualityMultiplier = (
  language: Language = "en",
): {
  multiplier: number;
  label: string;
} => {
  const rand = Math.random();

  if (rand < 0.1) {
    // 10% chance - Poor form
    return { multiplier: 0.9, label: t(language, "workout.formNeedsWork") };
  } else if (rand < 0.6) {
    // 50% chance - Good form
    return { multiplier: 1.0, label: "" };
  } else if (rand < 0.9) {
    // 30% chance - Great form
    return { multiplier: 1.3, label: t(language, "workout.greatForm") };
  } else {
    // 10% chance - Perfect form
    return { multiplier: 1.8, label: t(language, "workout.perfectForm") };
  }
};

// Critical success system for individual exercises
export const getCriticalBonus = (
  baseXP: number,
  language: Language = "en",
): { bonus: number; message: string } => {
  const rand = Math.random();

  if (rand < 0.05) {
    // 5% chance - Perfect set (3x XP)
    return {
      bonus: Math.floor(baseXP * 2),
      message: t(language, "workout.perfectSet"),
    };
  } else if (rand < 0.2) {
    // 15% chance - Critical rep (2x XP)
    return {
      bonus: Math.floor(baseXP),
      message: t(language, "workout.criticalRep"),
    };
  }

  return { bonus: 0, message: "" };
};

interface WorkoutResult {
  newXp: number;
  newLevel: number;
  newSkillPoints: number;
  messages: string[];
  milestoneReached: boolean;
  milestoneLevel?: number;
}

interface WorkoutProcessParams {
  sessionXP: number;
  currentState: {
    xp: number;
    level: number;
    skillPoints: number;
    discipline: number;
    currentStreak: number;
    dailyBonusClaimed: string | null;
  };
  setDailyBonusClaimed: (value: string | null) => void;
}

export const processWorkout = ({
  sessionXP,
  currentState,
  setDailyBonusClaimed,
}: WorkoutProcessParams): WorkoutResult => {
  const safeXP = safeNumber(currentState.xp, 0, 0);
  const safeLevel = safeNumber(currentState.level, 1, 1);

  let newXp = safeXP;
  let newLevel = safeLevel;
  let newSkillPoints = currentState.skillPoints;
  const messages: string[] = [];
  let milestoneReached = false;
  let milestoneLevel: number | undefined;

  // Normal level: gain XP
  newXp = safeXP + sessionXP;

  const reqXP = getRequiredXP(safeLevel);
  if (Number.isFinite(reqXP) && reqXP > 0 && newXp >= reqXP) {
    newXp -= reqXP;
    newLevel = safeLevel + 1;
    newSkillPoints += 1;

    // Check for milestone (every 5 levels)
    if (newLevel % 5 === 0 && newLevel >= 5) {
      milestoneReached = true;
      milestoneLevel = newLevel;
    }
  }

  // Ensure valid numbers
  newXp = safeNumber(newXp, 0, 0);
  newLevel = safeNumber(newLevel, 1, 1);

  return {
    newXp,
    milestoneReached,
    milestoneLevel,
    newLevel,
    newSkillPoints,
    messages,
  };
};

interface BonusCalculationParams {
  baseXP: number;
  currentStreak: number;
  statBonus: number;
  discipline: number;
  dailyBonusClaimed: string | null;
  sessionCount: number;
  setDailyBonusClaimed?: (value: string | null) => void;
  setSessionCount?: (value: number) => void;
  language?: Language;
}

export const calculateBonuses = ({
  baseXP,
  currentStreak,
  statBonus,
  discipline,
  dailyBonusClaimed,
  sessionCount,
  setDailyBonusClaimed,
  setSessionCount,
  language = "en",
}: BonusCalculationParams): {
  xp: number;
  messages: string[];
  newDailyBonusClaimed?: string | null;
  newSessionCount?: number;
} => {
  let xp = baseXP;
  const messages: string[] = [];

  // Apply quality multiplier
  const quality = getQualityMultiplier(language);
  if (quality.multiplier !== 1.0) {
    xp = Math.floor(xp * quality.multiplier);
    if (quality.label) {
      messages.push(quality.label);
    }
  }

  // Check for critical success
  const critical = getCriticalBonus(xp, language);
  if (critical.bonus > 0) {
    xp += critical.bonus;
    messages.push(critical.message);
  }

  // Apply streak multiplier
  xp = applyStreakMultiplier(xp, currentStreak);

  // Apply stat bonus
  xp = Math.floor(xp * statBonus);

  // Daily bonus
  const today = getToday();
  let newDailyBonusClaimed = dailyBonusClaimed;
  if (dailyBonusClaimed !== today) {
    const disciplineBonus = calculateStatBonus(discipline);
    const bonusAmount = Math.floor(DAILY_BONUS * disciplineBonus);
    xp += bonusAmount;
    messages.push(t(language, "workout.dailyBonus", { amount: bonusAmount }));
    newDailyBonusClaimed = today;
    if (setDailyBonusClaimed) setDailyBonusClaimed(today);
  }

  // Track session count (for future features if needed)
  const newSessionCount = sessionCount + 1;
  if (setSessionCount) setSessionCount(newSessionCount);

  return { xp, messages, newDailyBonusClaimed, newSessionCount };
};
