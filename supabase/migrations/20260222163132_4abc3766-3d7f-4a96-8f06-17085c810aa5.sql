-- Enable realtime for notes_pages to support collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes_pages;