import { supabase } from "@/lib/supabase";

export interface WorkoutLogEntry {
  user_id: string;
  muscle_group: string;
  exercise_id: string;
  exercise_name: string;
  duration_seconds: number;
  sets: number;
  reps: number;
  xp: number;
  equipment: string;
  difficulty: string;
  created_at?: string;
  id?: string; // UUID in database
}

export const logWorkout = async (entry: WorkoutLogEntry) => {
  console.log("logWorkout called with:", entry);
  const result = await supabase.from("workout_logs").insert(entry);

  if (result.error) {
    console.error("logWorkout error:", result.error);
  } else {
    console.log("logWorkout success");
  }

  return result;
};

export const getExerciseWorkoutHistory = async (
  userId: string,
  exerciseId: string,
  limit = 10,
) => {
  console.log("Fetching workout history for:", { userId, exerciseId, limit });

  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching workout history:", error);
    return [];
  }

  console.log("Workout history data:", data);
  return data as WorkoutLogEntry[];
};
