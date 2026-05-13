-- Add gender and profile_image columns to game_states table
-- This allows admin dashboard to display user avatars without requiring auth.admin access

ALTER TABLE game_states
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_game_states_profile ON game_states(user_id, gender, profile_image);

-- Update existing records with data from auth.users metadata (run once)
-- Note: This requires admin access and should be run from Supabase dashboard or backend
-- UPDATE game_states gs
-- SET 
--   gender = (SELECT (auth.users.raw_user_meta_data->>'gender')::VARCHAR FROM auth.users WHERE auth.users.id = gs.user_id),
--   profile_image = (SELECT (auth.users.raw_user_meta_data->>'profile_image')::TEXT FROM auth.users WHERE auth.users.id = gs.user_id);
