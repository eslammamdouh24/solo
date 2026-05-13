-- Migrate existing profile data from auth.users to game_states
-- Run this once after adding gender and profile_image columns

-- Update game_states with data from auth.users metadata
UPDATE game_states
SET 
  gender = COALESCE(
    (SELECT raw_user_meta_data->>'gender' 
     FROM auth.users 
     WHERE auth.users.id = game_states.user_id),
    gender
  ),
  profile_image = COALESCE(
    (SELECT raw_user_meta_data->>'profile_image' 
     FROM auth.users 
     WHERE auth.users.id = game_states.user_id),
    profile_image
  )
WHERE user_id IN (SELECT id FROM auth.users);

-- Verify the migration
SELECT 
  user_id,
  username,
  gender,
  CASE 
    WHEN profile_image IS NOT NULL THEN 'Has image'
    ELSE 'No image'
  END as image_status
FROM game_states
ORDER BY created_at DESC
LIMIT 10;
