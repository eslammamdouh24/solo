-- Database Schema Cleanup
-- Run this in Supabase SQL Editor to remove unused/duplicate tables

-- 1. Drop unused game_stats table (duplicate of game_states)
-- WARNING: This will permanently delete the game_stats table and all its data
-- Only run this if you've confirmed game_stats is not being used

DROP TABLE IF EXISTS public.game_stats CASCADE;

-- Verify game_states table structure is correct
-- (This is just a check query, not a modification)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'game_states'
ORDER BY ordinal_position;

-- Expected columns in game_states:
-- - user_id (uuid)
-- - username (text)
-- - level (integer)
-- - xp (integer)
-- - strength (integer)
-- - endurance (integer)
-- - discipline (integer)
-- - currentStreak (integer)
-- - bestStreak (integer)
-- - skillPoints (integer)
-- - totalWorkouts (integer)
-- - lastWorkoutDate (text)
-- - created_at (timestamp)
-- - updated_at (timestamp)

-- Verify no other code references game_stats
-- (Manual check required - search your codebase for "game_stats")

COMMENT ON TABLE public.game_states IS 
'Stores user game progression data: level, XP, stats, streaks. Single source of truth.';
