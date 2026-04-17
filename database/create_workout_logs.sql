-- Create workout_logs table
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muscle_group TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  xp INTEGER NOT NULL,
  equipment TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert their own logs
CREATE POLICY "Users can insert their own workout logs" ON public.workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to view their own logs
CREATE POLICY "Users can view their own workout logs" ON public.workout_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id_created_at ON public.workout_logs(user_id, created_at DESC);