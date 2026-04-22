-- Run this SQL in your Supabase SQL Editor
-- Adds admin role support to the app

-- Step 1: Add role column to game_states
ALTER TABLE public.game_states 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Step 2: Create index for role lookups
CREATE INDEX IF NOT EXISTS game_states_role_idx ON game_states(role);

-- Step 3: Update RLS policies to allow admin access

-- Drop existing SELECT policy and create new one with admin access
DROP POLICY IF EXISTS "Users can view their own game state" ON game_states;

CREATE POLICY "Users can view own state, admins view all"
ON game_states
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM game_states 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Drop existing UPDATE policy and create new one with admin access
DROP POLICY IF EXISTS "Users can update their own game state" ON game_states;

CREATE POLICY "Users can update own state, admins update all"
ON game_states
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM game_states 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM game_states 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete any user's game state
DROP POLICY IF EXISTS "Admins can delete any game state" ON game_states;

CREATE POLICY "Admins can delete any game state"
ON game_states
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM game_states 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admin can view all workout logs
DROP POLICY IF EXISTS "Admins can view all workout logs" ON workout_logs;

CREATE POLICY "Admins can view all workout logs"
ON workout_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM game_states 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Step 4: Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM game_states 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Step 5: Create function to promote user to admin (only callable by existing admins)
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  -- Promote target user
  UPDATE game_states 
  SET role = 'admin' 
  WHERE user_id = target_user_id;
END;
$$;

-- Step 6: Create function to demote admin to user
CREATE OR REPLACE FUNCTION demote_to_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;
  
  -- Prevent self-demotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot demote yourself';
  END IF;
  
  -- Demote target user
  UPDATE game_states 
  SET role = 'user' 
  WHERE user_id = target_user_id;
END;
$$;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION demote_to_user(UUID) TO authenticated;

-- Step 8: Manually set first admin (REPLACE 'your-email@example.com' with your actual email)
-- UPDATE game_states 
-- SET role = 'admin' 
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1
-- );

-- Note: Uncomment the above query and replace the email to create your first admin!
