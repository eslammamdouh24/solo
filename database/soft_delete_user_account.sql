-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This replaces the hard delete with a soft delete (30-day recovery period)

-- Step 1: Add deleted_at column to game_states (if it doesn't exist)
ALTER TABLE public.game_states
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Step 2: Drop old hard-delete function
DROP FUNCTION IF EXISTS delete_user_account();

-- Step 3: Soft delete — marks account as deleted (30-day grace period)
CREATE OR REPLACE FUNCTION soft_delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.game_states
  SET deleted_at = NOW()
  WHERE user_id = auth.uid();
END;
$$;

-- Step 4: Restore — clears deleted_at so user can continue playing
CREATE OR REPLACE FUNCTION restore_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.game_states
  SET deleted_at = NULL
  WHERE user_id = auth.uid();
END;
$$;

-- Step 5: Permanent delete — called after 30 days (or manually)
-- Deletes game_states row AND auth user
CREATE OR REPLACE FUNCTION permanently_delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.game_states WHERE user_id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Step 6: Check if account is expired (deleted_at > 30 days ago)
-- Returns the deleted_at timestamp if soft-deleted, NULL if active
CREATE OR REPLACE FUNCTION check_account_deletion_status()
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deletion_date TIMESTAMPTZ;
BEGIN
  SELECT deleted_at INTO deletion_date
  FROM public.game_states
  WHERE user_id = auth.uid();
  
  RETURN deletion_date;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION soft_delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION restore_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION check_account_deletion_status() TO authenticated;
