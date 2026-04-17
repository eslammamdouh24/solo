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
}

export const logWorkout = async (entry: WorkoutLogEntry) => {
  return supabase.from("workout_logs").insert(entry);
};
