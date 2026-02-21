
-- Add share_code column for public sharing
ALTER TABLE public.grocery_lists
ADD COLUMN share_code text UNIQUE DEFAULT NULL;

-- Create index for fast lookup
CREATE INDEX idx_grocery_lists_share_code ON public.grocery_lists (share_code) WHERE share_code IS NOT NULL;

-- Allow public read access via share_code (no auth needed)
CREATE POLICY "Anyone can view shared grocery lists"
ON public.grocery_lists
FOR SELECT
USING (share_code IS NOT NULL AND share_code = share_code);
