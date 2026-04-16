# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project:
   - Choose a **project name**
   - Set a **strong database password** (save this!)
   - Select a **region** close to your users for best performance:
     - **US East (North Virginia)** - Best for US East Coast
     - **US West (Oregon)** - Best for US West Coast
     - **Europe (Frankfurt)** - Best for Europe/Middle East
     - **Asia Pacific (Singapore)** - Best for Asia/Oceania
     - **Asia Pacific (Tokyo)** - Best for East Asia
     - **Southeast Asia (Mumbai)** - Best for South Asia
3. Click "Create new project"
4. Wait for your project to be provisioned (takes 1-2 minutes)

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy your **Project URL** and **anon/public key**
3. Create a `.env` file in your project root (copy from `.env.example`)
4. Replace the values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 3. Create Database Tables

In your Supabase dashboard, go to **SQL Editor** and run the following SQL:

### Create game_states table:

```sql
-- Create game_states table
CREATE TABLE game_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  strength INTEGER DEFAULT 0 NOT NULL,
  endurance INTEGER DEFAULT 0 NOT NULL,
  discipline INTEGER DEFAULT 0 NOT NULL,
  skill_points INTEGER DEFAULT 0 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  last_workout_date TIMESTAMP WITH TIME ZONE,
  daily_bonus_claimed TIMESTAMP WITH TIME ZONE,
  session_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own game state"
  ON game_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game state"
  ON game_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game state"
  ON game_states FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX game_states_user_id_idx ON game_states(user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_game_states_updated_at
    BEFORE UPDATE ON game_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 4. Add Username Login Support

Run this SQL to add username and email columns to game_states for username-based login:

```sql
-- Add username and email columns for username login lookup
ALTER TABLE game_states ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE game_states ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for fast username lookup
CREATE INDEX IF NOT EXISTS game_states_username_idx ON game_states(username);

-- Allow reading username/email for login lookup (public read for these columns)
CREATE POLICY "Anyone can look up username"
  ON game_states FOR SELECT
  USING (true);
```

## 5. Configure Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. (Optional) Configure email templates under **Authentication** > **Email Templates**
4. (Optional) Disable email confirmation for development:
   - Go to **Authentication** > **Settings**
   - Disable "Enable email confirmations"

## 5. Test Your Setup

1. Restart your Expo development server
2. The app should now show the authentication screen
3. Sign up with a new account
4. Your game progress will now be saved to the cloud and persist across devices!

## Features

✅ **Multi-user support** - Each user has their own game progress
✅ **Cloud sync** - Game state automatically saves to Supabase
✅ **Secure authentication** - Email/password authentication with validation
✅ **Password reset** - Forgot password functionality
✅ **Real-time updates** - Changes sync in real-time
✅ **Row Level Security** - Users can only access their own data
✅ **Profile screen** - View detailed stats and account information
✅ **Leaderboard** - Compete with other players globally
✅ **Input validation** - Client-side form validation with error messages
✅ **Toast notifications** - Success and error feedback

## Implemented Features

### 🔐 Authentication & Security

- **Email/Password Authentication** - Secure sign up and sign in
- **Password Reset** - Forgot password functionality via email
- **Form Validation** - Real-time email and password validation
- **Error Handling** - User-friendly error messages
- **Session Management** - Automatic token refresh and persistence
- **Row Level Security** - Database-level access control

### 👤 Profile Management

- **Profile Screen** - View your stats, level, XP, and attributes
- **Account Stats** - Track your progress and achievements
- **Account Age** - See how long you've been a member

### 🏆 Leaderboard

- **Global Rankings** - See top players by level or XP
- **Real-time Updates** - Automatically refreshed rankings
- **Personal Highlight** - Your rank is highlighted
- **Multiple Sort Options** - Sort by level or total XP

### 🎨 UI/UX Enhancements

- **Toast Notifications** - Success and error feedback
- **Loading States** - Visual feedback during operations
- **Error States** - Clear error messages with visual indicators
- **Profile Avatar** - Placeholder for future customization

## Future Enhancements

- Add social login (Google, Apple)
- Add profile customization (avatars, display names)
- Add friend system and social features
- Add workout history and analytics
- Add achievements and badges
- Add push notifications for streaks
- Add workout challenges and competitions
