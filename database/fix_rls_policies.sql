-- Fix RLS policies for game_states table
-- Run this SQL in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own game state" ON game_states;
DROP POLICY IF EXISTS "Users can insert their own game state" ON game_states;
DROP POLICY IF EXISTS "Users can update their own game state" ON game_states;
DROP POLICY IF EXISTS "Users can delete their own game state" ON game_states;

-- Ensure RLS is enabled
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT their own game state (including deleted ones)
CREATE POLICY "Users can view their own game state"
ON game_states
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to INSERT their own game state
CREATE POLICY "Users can insert their own game state"
ON game_states
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own game state (including restoring deleted ones)
CREATE POLICY "Users can update their own game state"
ON game_states
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to DELETE their own game state (not recommended, use soft delete)
-- Uncomment if you want to allow hard deletes
-- CREATE POLICY "Users can delete their own game state"
-- ON game_states
-- FOR DELETE
-- TO authenticated
-- USING (auth.uid() = user_id);
