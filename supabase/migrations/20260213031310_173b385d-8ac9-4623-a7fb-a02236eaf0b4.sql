
-- Table to persist grocery lists
CREATE TABLE public.grocery_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  checked_items JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own grocery lists"
ON public.grocery_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own grocery lists"
ON public.grocery_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grocery lists"
ON public.grocery_lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grocery lists"
ON public.grocery_lists FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_grocery_lists_updated_at
BEFORE UPDATE ON public.grocery_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
