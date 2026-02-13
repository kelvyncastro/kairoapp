
-- Create notes_folders table
CREATE TABLE public.notes_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT NULL,
  is_expanded BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders" ON public.notes_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON public.notes_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.notes_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.notes_folders FOR DELETE USING (auth.uid() = user_id);

-- Create notes_pages table
CREATE TABLE public.notes_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Sem titulo',
  icon TEXT NOT NULL DEFAULT '📄',
  folder_id UUID REFERENCES public.notes_folders(id) ON DELETE SET NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  tags TEXT[] NOT NULL DEFAULT '{}',
  content TEXT NOT NULL DEFAULT '<p></p>',
  comments JSONB NOT NULL DEFAULT '[]',
  activity_log JSONB NOT NULL DEFAULT '[]',
  versions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pages" ON public.notes_pages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pages" ON public.notes_pages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pages" ON public.notes_pages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pages" ON public.notes_pages FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_notes_folders_updated_at
  BEFORE UPDATE ON public.notes_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_pages_updated_at
  BEFORE UPDATE ON public.notes_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
