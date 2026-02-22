
-- Add parent_id to notes_pages for sub-pages (page within page)
ALTER TABLE public.notes_pages 
ADD COLUMN parent_id UUID REFERENCES public.notes_pages(id) ON DELETE CASCADE;

-- Index for faster lookups
CREATE INDEX idx_notes_pages_parent_id ON public.notes_pages(parent_id);
