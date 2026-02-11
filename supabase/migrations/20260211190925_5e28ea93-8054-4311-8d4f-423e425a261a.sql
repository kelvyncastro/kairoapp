-- Add section column to habits for period grouping (morning, afternoon, night)
ALTER TABLE public.habits 
ADD COLUMN section text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.habits.section IS 'Period section: morning, afternoon, night, or null for unassigned';