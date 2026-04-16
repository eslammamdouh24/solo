import { MuscleGroup } from "@/constants/exercises";
import { useState } from "react";

export const useGameState = () => {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [strength, setStrength] = useState(0);
  const [endurance, setEndurance] = useState(0);
  const [discipline, setDiscipline] = useState(0);
  const [skillPoints, setSkillPoints] = useState(0);

  const upgradeStrength = () => {
    if (skillPoints > 0) {
      setStrength((prev) => prev + 1);
      setSkillPoints((prev) => prev - 1);
    }
  };

  const upgradeEndurance = () => {
    if (skillPoints > 0) {
      setEndurance((prev) => prev + 1);
      setSkillPoints((prev) => prev - 1);
    }
  };

  const upgradeDiscipline = () => {
    if (skillPoints > 0) {
      setDiscipline((prev) => prev + 1);
      setSkillPoints((prev) => prev - 1);
    }
  };

  return {
    level,
    setLevel,
    xp,
    setXp,
    strength,
    setStrength,
    endurance,
    setEndurance,
    discipline,
    setDiscipline,
    skillPoints,
    setSkillPoints,
    upgradeStrength,
    upgradeEndurance,
    upgradeDiscipline,
  };
};

export const useBossState = () => {
  const [bossHP, setBossHP] = useState(0);
  const [bossMaxHP, setBossMaxHP] = useState(0);
  const [bossDefeated, setBossDefeated] = useState(false);

  const initializeBoss = (requiredXP: number) => {
    const maxHP = Math.floor(requiredXP * 1.5);
    setBossMaxHP(maxHP);
    setBossHP(maxHP);
  };

  const resetBoss = () => {
    setBossHP(0);
    setBossMaxHP(0);
  };

  return {
    bossHP,
    setBossHP,
    bossMaxHP,
    setBossMaxHP,
    bossDefeated,
    setBossDefeated,
    initializeBoss,
    resetBoss,
  };
};

export const useStreakState = () => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState<string | null>(
    null,
  );
  const [sessionCount, setSessionCount] = useState(0);

  return {
    currentStreak,
    setCurrentStreak,
    lastWorkoutDate,
    setLastWorkoutDate,
    dailyBonusClaimed,
    setDailyBonusClaimed,
    sessionCount,
    setSessionCount,
  };
};

export const useDiminishingReturns = () => {
  const [lastMuscleGroup, setLastMuscleGroup] = useState<MuscleGroup | null>(
    null,
  );
  const [sameGroupCount, setSameGroupCount] = useState(0);

  const calculateMultiplier = (currentGroup: MuscleGroup) => {
    if (lastMuscleGroup === currentGroup) {
      const newCount = sameGroupCount + 1;
      setSameGroupCount(newCount);
      return Math.pow(0.8, newCount);
    } else {
      setLastMuscleGroup(currentGroup);
      setSameGroupCount(0);
      return 1;
    }
  };

  const reset = () => {
    setLastMuscleGroup(null);
    setSameGroupCount(0);
  };

  return { calculateMultiplier, reset };
};
