# Database Schema Documentation

## Active Tables

### 1. `game_states`
**Purpose:** Stores user progression data (level, XP, stats, streaks)

**Columns:**
- `user_id` (uuid, primary key) - References auth.users
- `username` (text) - User display name
- `level` (integer) - Current level
- `xp` (integer) - Experience points
- `strength` (integer) - Strength stat
- `endurance` (integer) - Endurance stat
- `discipline` (integer) - Discipline stat
- `currentStreak` (integer) - Current workout streak
- `bestStreak` (integer) - Best workout streak ever
- `skillPoints` (integer) - Available skill points
- `totalWorkouts` (integer) - Total workouts completed
- `lastWorkoutDate` (text) - ISO date of last workout
- `created_at` (timestamp)
- `updated_at` (timestamp)

**RLS Policies:**
- Users can read their own data
- Users can update their own data
- Admin can read/update all data

---

### 2. `user_profiles`
**Purpose:** Stores user profile information

**Columns:**
- `user_id` (uuid, primary key)
- `username` (text, unique)
- `full_name` (text)
- `date_of_birth` (date)
- `gender` (text) - 'male', 'female', or 'both'
- `profile_image` (text) - URL to profile picture
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

### 3. `workout_logs`
**Purpose:** Tracks individual workout sessions

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid) - References auth.users
- `exercise_id` (text) - Exercise identifier
- `muscle_group` (text) - Targeted muscle
- `duration_seconds` (integer) - Workout duration
- `xp_earned` (integer) - XP from this workout
- `created_at` (timestamp)

**Indexes:**
- `user_id` for fast user lookups
- `created_at` for date filtering

---

### 4. `achievements`
**Purpose:** Tracks user achievements/milestones

---

### 5. `leaderboard`
**Purpose:** Cached leaderboard rankings

---

### 6. `user_settings`
**Purpose:** User preferences (theme, language, etc.)

---

## Cleanup Tasks

### ❌ Tables to Remove

#### `game_stats` (DUPLICATE)
- **Status:** Unused duplicate of `game_states`
- **Action:** Run `database/cleanup_schema.sql` in Supabase SQL Editor
- **Impact:** No impact - table is not referenced in code

---

## SQL Migration Files

### `cleanup_schema.sql` (NEW)
Removes unused `game_stats` table

### `create_workout_logs.sql`
Creates workout_logs table with proper indexes

### `fix_rls_policies.sql`
Updates Row Level Security policies

### `soft_delete_user_account.sql`
Marks user account as deleted (30-day grace period)

### `delete_user_account.sql`
Permanently deletes user account and all data

### `add_admin_role.sql`
Grants admin role to specific users

---

## Running Migrations

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of SQL file
4. Run the query
5. Verify changes in Table Editor

---

## Naming Convention

- **Tables:** `snake_case` (e.g., `game_states`)
- **Columns:** `camelCase` in TypeScript, `snake_case` in database
- **Foreign Keys:** `table_id` (e.g., `user_id`)

---

## Best Practices

1. **Always backup** before running migrations
2. **Test on development** first
3. **Use transactions** for multi-step changes
4. **Verify RLS policies** after schema changes
5. **Update TypeScript types** after schema changes

---

## Verification Queries

### Check table exists:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Check RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'game_states';
```

### Count records:
```sql
SELECT COUNT(*) FROM game_states;
SELECT COUNT(*) FROM workout_logs;
```
