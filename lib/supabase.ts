import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a web-compatible storage adapter
const createStorageAdapter = () => {
  if (Platform.OS === "web") {
    return {
      getItem: async (key: string) => {
        if (typeof localStorage === "undefined") return null;
        return localStorage.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        if (typeof localStorage === "undefined") return;
        localStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        if (typeof localStorage === "undefined") return;
        localStorage.removeItem(key);
      },
    };
  }
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

// Database types
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

export interface GameState {
  user_id: string;
  level: number;
  xp: number;
  strength: number;
  endurance: number;
  discipline: number;
  skill_points: number;
  current_streak: number;
  last_workout_date: string | null;
  daily_bonus_claimed: string | null;
  session_count: number;
  updated_at: string;
  deleted_at: string | null;
}
