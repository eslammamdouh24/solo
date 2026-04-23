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
  role?: string;
  updated_at?: string;
}

// Shared in-memory cache + in-flight promise map so every caller (game state
// hook, admin check, etc.) hits Supabase at most once per userId per session.
const stateCache = new Map<string, any>();
const stateInflight = new Map<string, Promise<any>>();

type GameStateResult = { data: any; error: any };

export const getGameState = (userId: string): Promise<GameStateResult> => {
  // Serve cached data instantly if present
  if (stateCache.has(userId)) {
    return Promise.resolve({ data: stateCache.get(userId), error: null });
  }
  // Dedupe concurrent callers
  if (stateInflight.has(userId)) {
    return stateInflight.get(userId)!;
  }

  const promise: Promise<GameStateResult> = Promise.resolve(
    supabase.from("game_states").select("*").eq("user_id", userId).single(),
  ).then((res) => {
    if (!res.error && res.data) stateCache.set(userId, res.data);
    stateInflight.delete(userId);
    return res as GameStateResult;
  });

  stateInflight.set(userId, promise);
  return promise;
};

export const invalidateGameState = (userId: string) => {
  stateCache.delete(userId);
  stateInflight.delete(userId);
};

export const primeGameState = (userId: string, data: any) => {
  stateCache.set(userId, data);
};

export const saveGameState = async (
  userId: string,
  state: Partial<GameStatePayload>,
) => {
  const res = await supabase.from("game_states").upsert(
    [
      {
        user_id: userId,
        ...state,
      },
    ],
    { onConflict: "user_id" },
  );
  // Merge into cache
  if (!res.error) {
    const prev = stateCache.get(userId) ?? {};
    stateCache.set(userId, { ...prev, ...state, user_id: userId });
  }
  return res;
};

export const updateGameState = async (
  userId: string,
  state: Partial<GameStatePayload>,
) => {
  const res = await supabase
    .from("game_states")
    .update(state)
    .eq("user_id", userId);
  if (!res.error) {
    const prev = stateCache.get(userId) ?? {};
    stateCache.set(userId, { ...prev, ...state });
  }
  return res;
};
