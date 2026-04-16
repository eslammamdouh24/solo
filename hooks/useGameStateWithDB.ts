import { MuscleGroup } from "@/constants/exercises";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

interface GameStateData {
  level: number;
  xp: number;
  strength: number;
  endurance: number;
  discipline: number;
  skillPoints: number;
  currentStreak: number;
  lastWorkoutDate: string | null;
  dailyBonusClaimed: string | null;
  sessionCount: number;
}

export const useGameStateWithDB = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [strength, setStrength] = useState(0);
  const [endurance, setEndurance] = useState(0);
  const [discipline, setDiscipline] = useState(0);
  const [skillPoints, setSkillPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState<string | null>(
    null,
  );
  const [sessionCount, setSessionCount] = useState(0);

  // Load game state from database
  const loadGameState = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("game_states")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // If no game state exists, create one
      if (error && error.code === "PGRST116") {
        // Wait for signUp to finish creating the game state
        // Then retry loading up to 3 times before creating our own
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise((r) => setTimeout(r, 500));

          const { data: rechecked } = await supabase
            .from("game_states")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (rechecked) {
            setLevel(rechecked.level);
            setXp(rechecked.xp);
            setStrength(rechecked.strength);
            setEndurance(rechecked.endurance);
            setDiscipline(rechecked.discipline);
            setSkillPoints(rechecked.skill_points);
            setCurrentStreak(rechecked.current_streak);
            setLastWorkoutDate(rechecked.last_workout_date);
            setDailyBonusClaimed(rechecked.daily_bonus_claimed);
            setSessionCount(rechecked.session_count);
            return; // Done — signUp created the state
          }
        }

        // After retries, still no data — create it ourselves
        const { data: newData } = await supabase
          .from("game_states")
          .upsert(
            [
              {
                user_id: user.id,
                level: 1,
                xp: 0,
                strength: 0,
                endurance: 0,
                discipline: 0,
                skill_points: 0,
                current_streak: 0,
                last_workout_date: null,
                daily_bonus_claimed: null,
                session_count: 0,
              },
            ],
            { onConflict: "user_id" },
          )
          .select()
          .single();

        if (newData) {
          setLevel(newData.level);
          setXp(newData.xp);
          setStrength(newData.strength);
          setEndurance(newData.endurance);
          setDiscipline(newData.discipline);
          setSkillPoints(newData.skill_points);
          setCurrentStreak(newData.current_streak);
          setLastWorkoutDate(newData.last_workout_date);
          setDailyBonusClaimed(newData.daily_bonus_claimed);
          setSessionCount(newData.session_count);
        }
      } else if (error) {
        console.error("Error loading game state:", error);
      } else if (data) {
        setLevel(data.level);
        setXp(data.xp);
        setStrength(data.strength);
        setEndurance(data.endurance);
        setDiscipline(data.discipline);
        setSkillPoints(data.skill_points);
        setCurrentStreak(data.current_streak);
        setLastWorkoutDate(data.last_workout_date);
        setDailyBonusClaimed(data.daily_bonus_claimed);
        setSessionCount(data.session_count);
      }
    } catch (error) {
      console.error("Error loading game state:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  // Save game state to database - batch update for multiple fields at once
  const saveGameState = async (state: Partial<GameStateData>) => {
    if (!user) return;

    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (state.level !== undefined) updatePayload.level = state.level;
      if (state.xp !== undefined) updatePayload.xp = state.xp;
      if (state.strength !== undefined) updatePayload.strength = state.strength;
      if (state.endurance !== undefined)
        updatePayload.endurance = state.endurance;
      if (state.discipline !== undefined)
        updatePayload.discipline = state.discipline;
      if (state.skillPoints !== undefined)
        updatePayload.skill_points = state.skillPoints;
      if (state.currentStreak !== undefined)
        updatePayload.current_streak = state.currentStreak;
      if (state.lastWorkoutDate !== undefined)
        updatePayload.last_workout_date = state.lastWorkoutDate;
      if (state.dailyBonusClaimed !== undefined)
        updatePayload.daily_bonus_claimed = state.dailyBonusClaimed;
      if (state.sessionCount !== undefined)
        updatePayload.session_count = state.sessionCount;

      const { error } = await supabase
        .from("game_states")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error saving game state:", error);
      }
    } catch (error) {
      console.error("Error saving game state:", error);
    }
  };

  // Batch update: sets multiple fields in local state AND saves all to DB in one call
  const batchUpdate = (updates: Partial<GameStateData>) => {
    if (updates.level !== undefined) setLevel(updates.level);
    if (updates.xp !== undefined) setXp(updates.xp);
    if (updates.strength !== undefined) setStrength(updates.strength);
    if (updates.endurance !== undefined) setEndurance(updates.endurance);
    if (updates.discipline !== undefined) setDiscipline(updates.discipline);
    if (updates.skillPoints !== undefined) setSkillPoints(updates.skillPoints);
    if (updates.currentStreak !== undefined)
      setCurrentStreak(updates.currentStreak);
    if (updates.lastWorkoutDate !== undefined)
      setLastWorkoutDate(updates.lastWorkoutDate);
    if (updates.dailyBonusClaimed !== undefined)
      setDailyBonusClaimed(updates.dailyBonusClaimed);
    if (updates.sessionCount !== undefined)
      setSessionCount(updates.sessionCount);
    saveGameState(updates);
  };

  // Wrapped setters that also save to database
  const setLevelWithDB = (value: number | ((prev: number) => number)) => {
    setLevel((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ level: newValue });
      return newValue;
    });
  };

  const setXpWithDB = (value: number | ((prev: number) => number)) => {
    setXp((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ xp: newValue });
      return newValue;
    });
  };

  const setStrengthWithDB = (value: number | ((prev: number) => number)) => {
    setStrength((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ strength: newValue });
      return newValue;
    });
  };

  const setEnduranceWithDB = (value: number | ((prev: number) => number)) => {
    setEndurance((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ endurance: newValue });
      return newValue;
    });
  };

  const setDisciplineWithDB = (value: number | ((prev: number) => number)) => {
    setDiscipline((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ discipline: newValue });
      return newValue;
    });
  };

  const setSkillPointsWithDB = (value: number | ((prev: number) => number)) => {
    setSkillPoints((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ skillPoints: newValue });
      return newValue;
    });
  };

  const setCurrentStreakWithDB = (
    value: number | ((prev: number) => number),
  ) => {
    setCurrentStreak((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ currentStreak: newValue });
      return newValue;
    });
  };

  const setLastWorkoutDateWithDB = (
    value: string | null | ((prev: string | null) => string | null),
  ) => {
    setLastWorkoutDate((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ lastWorkoutDate: newValue });
      return newValue;
    });
  };

  const setDailyBonusClaimedWithDB = (
    value: string | null | ((prev: string | null) => string | null),
  ) => {
    setDailyBonusClaimed((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ dailyBonusClaimed: newValue });
      return newValue;
    });
  };

  const setSessionCountWithDB = (
    value: number | ((prev: number) => number),
  ) => {
    setSessionCount((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      saveGameState({ sessionCount: newValue });
      return newValue;
    });
  };

  const upgradeStrength = () => {
    if (skillPoints > 0) {
      const newStrength = strength + 1;
      const newSkillPoints = skillPoints - 1;
      setStrength(newStrength);
      setSkillPoints(newSkillPoints);
      saveGameState({ strength: newStrength, skillPoints: newSkillPoints });
    }
  };

  const upgradeEndurance = () => {
    if (skillPoints > 0) {
      const newEndurance = endurance + 1;
      const newSkillPoints = skillPoints - 1;
      setEndurance(newEndurance);
      setSkillPoints(newSkillPoints);
      saveGameState({ endurance: newEndurance, skillPoints: newSkillPoints });
    }
  };

  const upgradeDiscipline = () => {
    if (skillPoints > 0) {
      const newDiscipline = discipline + 1;
      const newSkillPoints = skillPoints - 1;
      setDiscipline(newDiscipline);
      setSkillPoints(newSkillPoints);
      saveGameState({ discipline: newDiscipline, skillPoints: newSkillPoints });
    }
  };

  const resetProgress = async () => {
    if (!user) return;

    const initialState = {
      level: 1,
      xp: 0,
      strength: 0,
      endurance: 0,
      discipline: 0,
      skillPoints: 0,
      currentStreak: 0,
      lastWorkoutDate: null,
      dailyBonusClaimed: null,
      sessionCount: 0,
    };

    // Update local state
    setLevel(1);
    setXp(0);
    setStrength(0);
    setEndurance(0);
    setDiscipline(0);
    setSkillPoints(0);
    setCurrentStreak(0);
    setLastWorkoutDate(null);
    setDailyBonusClaimed(null);
    setSessionCount(0);

    // Update database
    await saveGameState(initialState);
  };

  return {
    loading,
    error,
    level,
    setLevel: setLevelWithDB,
    xp,
    setXp: setXpWithDB,
    strength,
    setStrength: setStrengthWithDB,
    endurance,
    setEndurance: setEnduranceWithDB,
    discipline,
    setDiscipline: setDisciplineWithDB,
    skillPoints,
    setSkillPoints: setSkillPointsWithDB,
    currentStreak,
    setCurrentStreak: setCurrentStreakWithDB,
    lastWorkoutDate,
    setLastWorkoutDate: setLastWorkoutDateWithDB,
    dailyBonusClaimed,
    setDailyBonusClaimed: setDailyBonusClaimedWithDB,
    sessionCount,
    setSessionCount: setSessionCountWithDB,
    upgradeStrength,
    upgradeEndurance,
    upgradeDiscipline,
    batchUpdate,
    resetProgress,
    refetch: loadGameState,
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
