-- Create goal progress history table
CREATE TABLE public.goal_progress_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add category column to goals table
ALTER TABLE public.goals 
ADD COLUMN category text DEFAULT 'PERSONAL';

-- Enable RLS
ALTER TABLE public.goal_progress_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own goal progress" 
ON public.goal_progress_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.goals g 
  WHERE g.id = goal_progress_history.goal_id 
  AND g.user_id = auth.uid()
));

CREATE POLICY "Users can insert own goal progress" 
ON public.goal_progress_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.goals g 
  WHERE g.id = goal_progress_history.goal_id 
  AND g.user_id = auth.uid()
));

CREATE POLICY "Users can delete own goal progress" 
ON public.goal_progress_history 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.goals g 
  WHERE g.id = goal_progress_history.goal_id 
  AND g.user_id = auth.uid()
));