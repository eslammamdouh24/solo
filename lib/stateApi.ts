import { supabase } from "@/lib/supabase";

export interface GameStatePayload {
  user_id: string;
  level?: number;
  xp?: number;
  strength?: number;
  endurance?: number;
  discipline?: number;
  skill_points?: number;
  current_streak?: number;
  last_workout_date?: string | null;
  daily_bonus_claimed?: string | null;
  session_count?: number;
  username?: string;
  updated_at?: string;
}

export const getGameState = async (userId: string) => {
  return supabase
    .from("game_states")
    .select("*")
    .eq("user_id", userId)
    .single();
};

export const saveGameState = async (
  userId: string,
  state: Partial<GameStatePayload>,
) => {
  return supabase.from("game_states").upsert(
    [
      {
        user_id: userId,
        ...state,
      },
    ],
    { onConflict: "user_id" },
  );
};

export const updateGameState = async (
  userId: string,
  state: Partial<GameStatePayload>,
) => {
  return supabase.from("game_states").update(state).eq("user_id", userId);
};
