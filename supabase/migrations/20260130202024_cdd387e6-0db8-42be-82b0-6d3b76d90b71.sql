-- Add timer columns to daily_tasks
ALTER TABLE public.daily_tasks
ADD COLUMN time_spent_seconds integer DEFAULT 0,
ADD COLUMN timer_started_at timestamp with time zone DEFAULT NULL;