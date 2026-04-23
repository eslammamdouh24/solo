import { supabase } from "@/lib/supabase";

export interface WorkoutStats {
  totalWorkouts: number;
  totalXP: number;
  totalDuration: number;
  avgWorkoutsPerWeek: number;
  currentStreak: number;
  bestStreak: number;
  mostTrainedMuscle: string;
}

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
export const getWorkoutStats = async (userId: string): Promise<WorkoutStats> => {
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
  const totalDuration = workouts?.reduce((sum, w) => sum + (w.duration_seconds || 0), 0) || 0;

  // Calculate workouts per week
  const firstWorkout = workouts?.[0]?.created_at;
  const weeksSinceFirst = firstWorkout
    ? Math.max(1, Math.ceil((Date.now() - new Date(firstWorkout).getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1;
  const avgWorkoutsPerWeek = totalWorkouts / weeksSinceFirst;

  // Find most trained muscle
  const muscleCounts = workouts?.reduce((acc, w) => {
    acc[w.muscle_group] = (acc[w.muscle_group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  const mostTrainedMuscle = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  // Calculate best streak from workout history
  let bestStreak = 0;
  let currentStreakCount = 0;
  const workoutDates = new Set(
    workouts?.map(w => new Date(w.created_at).toDateString()) || []
  );
  
  const dates = Array.from(workoutDates).sort();
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 || 
        (new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime()) <= 2 * 24 * 60 * 60 * 1000) {
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
    avgWorkoutsPerWeek: Math.round(avgWorkoutsPerWeek * 10) / 10,
    currentStreak: gameState?.current_streak || 0,
    bestStreak,
    mostTrainedMuscle,
  };
};

/**
 * Get weekly activity data (last 7 days)
 */
export const getWeeklyActivity = async (userId: string): Promise<WeeklyActivity[]> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("workout_logs")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString());

  if (error) throw error;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  const counts: Record<string, number> = {};

  // Initialize all 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const dayIndex = (today - i + 7) % 7;
    counts[days[dayIndex]] = 0;
  }

  // Count workouts per day
  data?.forEach((workout) => {
    const date = new Date(workout.created_at);
    const dayName = days[date.getDay()];
    counts[dayName] = (counts[dayName] || 0) + 1;
  });

  // Return in order (oldest to newest)
  return Object.entries(counts).map(([day, count]) => ({ day, count }));
};

/**
 * Get muscle group distribution
 */
export const getMuscleDistribution = async (userId: string): Promise<MuscleDistribution[]> => {
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
  return Object.entries(counts)
    .map(([muscle, count]) => ({
      muscle,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
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
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      xp,
      cumulativeXp: cumulative,
    };
  });
};

/**
 * Get equipment usage distribution
 */
export const getEquipmentUsage = async (userId: string): Promise<EquipmentUsage[]> => {
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
export const getRecentWorkouts = async (userId: string): Promise<RecentWorkout[]> => {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("id, exercise_name, muscle_group, xp, duration_seconds, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
};
