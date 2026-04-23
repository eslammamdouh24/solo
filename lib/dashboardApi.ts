import { supabase } from "@/lib/supabase";

export interface WorkoutStats {
  totalWorkouts: number;
  totalXP: number;
  totalDuration: number;
  totalCalories: number;
  avgWorkoutsPerWeek: number;
  currentStreak: number;
  bestStreak: number;
  mostTrainedMuscle: string;
}

// MET values for calorie estimation (assumes ~70kg body weight)
// kcal = MET * weight(kg) * hours
const MUSCLE_MET: Record<string, number> = {
  cardio: 8,
  upper_legs: 6,
  lower_legs: 6,
  back: 5.5,
  chest: 5,
  shoulders: 5,
  biceps: 4.5,
  triceps: 4.5,
  lower_arms: 4,
  waist_core: 5,
};
const ASSUMED_WEIGHT_KG = 70;
const estimateCalories = (durationSeconds: number, muscleGroup: string) => {
  const met = MUSCLE_MET[muscleGroup] ?? 5;
  const hours = durationSeconds / 3600;
  return met * ASSUMED_WEIGHT_KG * hours;
};

export interface WeeklyActivity {
  day: string;
  count: number;
}

export interface MuscleDistribution {
  muscle: string;
  count: number;
  percentage: number;
}

export interface XPProgress {
  date: string;
  xp: number;
  cumulativeXp: number;
}

export interface StatsEvolution {
  date: string;
  strength: number;
  endurance: number;
  discipline: number;
}

export interface EquipmentUsage {
  equipment: string;
  count: number;
  percentage: number;
}

export interface RecentWorkout {
  id: string;
  exercise_name: string;
  muscle_group: string;
  xp: number;
  duration_seconds: number;
  created_at: string;
}

/**
 * Fetch comprehensive workout statistics
 */
export const getWorkoutStats = async (
  userId: string,
): Promise<WorkoutStats> => {
  // Get workout logs
  const { data: workouts, error: workoutsError } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (workoutsError) throw workoutsError;

  // Get game state for streak info
  const { data: gameState, error: gameError } = await supabase
    .from("game_states")
    .select("current_streak")
    .eq("user_id", userId)
    .single();

  if (gameError && gameError.code !== "PGRST116") throw gameError;

  const totalWorkouts = workouts?.length || 0;
  const totalXP = workouts?.reduce((sum, w) => sum + (w.xp || 0), 0) || 0;
  const totalDuration =
    workouts?.reduce((sum, w) => sum + (w.duration_seconds || 0), 0) || 0;
  const totalCalories = Math.round(
    workouts?.reduce(
      (sum, w) =>
        sum + estimateCalories(w.duration_seconds || 0, w.muscle_group),
      0,
    ) || 0,
  );

  // Calculate workouts per week
  const firstWorkout = workouts?.[0]?.created_at;
  const weeksSinceFirst = firstWorkout
    ? Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(firstWorkout).getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        ),
      )
    : 1;
  const avgWorkoutsPerWeek = totalWorkouts / weeksSinceFirst;

  // Find most trained muscle
  const muscleCounts =
    workouts?.reduce(
      (acc, w) => {
        acc[w.muscle_group] = (acc[w.muscle_group] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  const mostTrainedMuscle =
    Object.entries(muscleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  // Calculate best streak from workout history
  let bestStreak = 0;
  let currentStreakCount = 0;
  const workoutDates = new Set(
    workouts?.map((w) => new Date(w.created_at).toDateString()) || [],
  );

  const dates = Array.from(workoutDates).sort();
  for (let i = 0; i < dates.length; i++) {
    if (
      i === 0 ||
      new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime() <=
        2 * 24 * 60 * 60 * 1000
    ) {
      currentStreakCount++;
      bestStreak = Math.max(bestStreak, currentStreakCount);
    } else {
      currentStreakCount = 1;
    }
  }

  return {
    totalWorkouts,
    totalXP,
    totalDuration,
    totalCalories,
    avgWorkoutsPerWeek: Math.round(avgWorkoutsPerWeek * 10) / 10,
    currentStreak: gameState?.current_streak || 0,
    bestStreak,
    mostTrainedMuscle,
  };
};

/**
 * Get weekly activity data (last 7 days)
 */
export const getWeeklyActivity = async (
  userId: string,
): Promise<WeeklyActivity[]> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("workout_logs")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString());

  if (error) throw error;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result: WeeklyActivity[] = [];

  // Build last 7 days in chronological order
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayName = dayNames[date.getDay()];
    const dateStr = date.toDateString();

    // Count workouts for this specific date
    const count =
      data?.filter((w) => new Date(w.created_at).toDateString() === dateStr)
        .length || 0;

    result.push({ day: dayName, count });
  }

  return result;
};

/**
 * Get muscle group distribution for ALL home-screen muscle groups
 * (zero-filled in home-screen order for consistency)
 */
const HOME_MUSCLE_ORDER = [
  "chest",
  "waist_core",
  "back",
  "shoulders",
  "upper_legs",
  "lower_legs",
  "biceps",
  "triceps",
  "lower_arms",
  "cardio",
];

export const getMuscleDistribution = async (
  userId: string,
): Promise<MuscleDistribution[]> => {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("muscle_group")
    .eq("user_id", userId);

  if (error) throw error;

  const counts: Record<string, number> = {};
  data?.forEach((workout) => {
    counts[workout.muscle_group] = (counts[workout.muscle_group] || 0) + 1;
  });

  const total = data?.length || 1;
  return HOME_MUSCLE_ORDER.map((muscle) => {
    const count = counts[muscle] || 0;
    return {
      muscle,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
};

/**
 * Get XP progress over last 30 days
 */
export const getXPProgress = async (userId: string): Promise<XPProgress[]> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("workout_logs")
    .select("xp, created_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  const dailyXP: Record<string, number> = {};
  data?.forEach((workout) => {
    const date = new Date(workout.created_at).toISOString().split("T")[0];
    dailyXP[date] = (dailyXP[date] || 0) + workout.xp;
  });

  let cumulative = 0;
  return Object.entries(dailyXP).map(([date, xp]) => {
    cumulative += xp;
    return {
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      xp,
      cumulativeXp: cumulative,
    };
  });
};

/**
 * Get equipment usage distribution
 */
export const getEquipmentUsage = async (
  userId: string,
): Promise<EquipmentUsage[]> => {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("equipment")
    .eq("user_id", userId);

  if (error) throw error;

  const counts: Record<string, number> = {};
  data?.forEach((workout) => {
    counts[workout.equipment] = (counts[workout.equipment] || 0) + 1;
  });

  const total = data?.length || 1;
  return Object.entries(counts)
    .map(([equipment, count]) => ({
      equipment,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Get recent workouts (last 10)
 */
export const getRecentWorkouts = async (
  userId: string,
): Promise<RecentWorkout[]> => {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("id, exercise_name, muscle_group, xp, duration_seconds, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
};
