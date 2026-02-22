-- Create storage bucket for note page icons
INSERT INTO storage.buckets (id, name, public) VALUES ('note-icons', 'note-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own icons
CREATE POLICY "Users can upload note icons"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'note-icons' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Note icons are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-icons');

-- Allow users to update their own icons
CREATE POLICY "Users can update their own note icons"
ON storage.objects FOR UPDATE
USING (bucket_id = 'note-icons' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own icons
CREATE POLICY "Users can delete their own note icons"
ON storage.objects FOR DELETE
USING (bucket_id = 'note-icons' AND auth.uid()::text = (storage.foldername(name))[1]);