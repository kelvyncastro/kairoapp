-- Create goal_categories table for custom user categories
CREATE TABLE public.goal_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'target',
  is_default BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add category_id column to goals table to link to custom categories
ALTER TABLE public.goals
ADD COLUMN category_id UUID REFERENCES public.goal_categories(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.goal_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own categories"
ON public.goal_categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
ON public.goal_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
ON public.goal_categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
ON public.goal_categories
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_goal_categories_updated_at
BEFORE UPDATE ON public.goal_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();