export const DAILY_BONUS = 40;

// Balanced level progression - designed for ~3-7 workouts per level
// Average workout: 300-500 XP (3 exercises + bonuses)
// Rounded to clean numbers for better UX
export const getRequiredXP = (level: number): number => {
  const lvl = Math.max(1, level || 1);

  let baseXP: number;

  if (lvl <= 10) {
    // Early levels: smooth progression, 3-6 workouts per level
    baseXP = 1200 * Math.pow(1.5, lvl);
  } else if (lvl <= 30) {
    // Mid levels: 5-10 workouts per level
    baseXP = 1000 * Math.pow(lvl, 1.5);
  } else if (lvl <= 50) {
    // Advanced levels: 10-20 workouts per level
    baseXP = 2000 * Math.pow(lvl, 1.5);
  } else {
    // End game levels: challenging but achievable
    baseXP = 5000 * Math.pow(lvl, 1.5);
  }

  // Round to nearest 1000 for clean numbers
  return Math.round(baseXP / 1000) * 1000;
};

export const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const getDayDiff = (dateA: string, dateB: string): number => {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
};

export const safeNumber = (
  value: number,
  min: number,
  fallback: number,
): number => {
  return Number.isFinite(value) && value >= min ? value : fallback;
};

export const applyStreakMultiplier = (xp: number, streak: number): number => {
  // Reduced streak bonuses for balance
  if (streak >= 30) return Math.floor(xp * 1.3); // +30% for 30 day streak
  if (streak >= 14) return Math.floor(xp * 1.2); // +20% for 2 week streak
  if (streak >= 7) return Math.floor(xp * 1.15); // +15% for 1 week streak
  if (streak >= 3) return Math.floor(xp * 1.1); // +10% for 3 day streak
  return xp;
};

// Stats should have meaningful impact (1% per point)
export const calculateStatBonus = (statValue: number): number => {
  return 1 + statValue * 0.01;
};
