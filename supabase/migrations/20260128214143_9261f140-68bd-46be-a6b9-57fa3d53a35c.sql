-- Fix: allow priority 0 (Baixa) in daily_tasks
ALTER TABLE public.daily_tasks
  DROP CONSTRAINT IF EXISTS daily_tasks_priority_check;

ALTER TABLE public.daily_tasks
  ADD CONSTRAINT daily_tasks_priority_check
  CHECK (priority IS NULL OR priority IN (0,1,2,3));
