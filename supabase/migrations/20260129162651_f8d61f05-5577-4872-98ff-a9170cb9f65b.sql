-- Create enum for habit log status
CREATE TYPE habit_log_status AS ENUM ('done', 'not_done', 'skipped');

-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  frequency JSONB NOT NULL DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]'::jsonb,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habit_logs table
CREATE TABLE public.habit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status habit_log_status NOT NULL DEFAULT 'not_done',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Habits policies
CREATE POLICY "Users can view own habits" ON public.habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

-- Habit logs policies (access through habit ownership)
CREATE POLICY "Users can view own habit logs" ON public.habit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid())
  );

CREATE POLICY "Users can create own habit logs" ON public.habit_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid())
  );

CREATE POLICY "Users can update own habit logs" ON public.habit_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own habit logs" ON public.habit_logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();