-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates a secure database function that fully deletes a user account

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS delete_user_account();

-- Create the function with SECURITY DEFINER (runs with admin privileges)
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the user's game state
  DELETE FROM public.game_states WHERE user_id = auth.uid();
  
  -- Delete the user from auth.users (this fully removes the auth account)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
