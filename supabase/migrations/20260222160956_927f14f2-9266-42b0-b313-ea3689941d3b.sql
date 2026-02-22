
-- Table to track shared notes
CREATE TABLE public.notes_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.notes_pages(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  shared_with_id uuid NOT NULL,
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(page_id, shared_with_id)
);

-- Enable RLS
ALTER TABLE public.notes_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage shares
CREATE POLICY "Owners can view shares" ON public.notes_shares
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);

CREATE POLICY "Owners can create shares" ON public.notes_shares
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update shares" ON public.notes_shares
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete shares" ON public.notes_shares
  FOR DELETE USING (auth.uid() = owner_id);

-- Allow shared users to SELECT notes_pages they have access to
CREATE POLICY "Shared users can view shared pages" ON public.notes_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notes_shares
      WHERE notes_shares.page_id = notes_pages.id
        AND notes_shares.shared_with_id = auth.uid()
    )
  );

-- Allow shared users with 'edit' permission to UPDATE shared pages
CREATE POLICY "Shared users can edit shared pages" ON public.notes_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.notes_shares
      WHERE notes_shares.page_id = notes_pages.id
        AND notes_shares.shared_with_id = auth.uid()
        AND notes_shares.permission = 'edit'
    )
  );

-- Function to find user by email or public_id for sharing
CREATE OR REPLACE FUNCTION public.find_user_for_sharing(p_identifier text)
RETURNS TABLE(user_id uuid, first_name text, avatar_url text, public_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.user_id,
    up.first_name,
    up.avatar_url,
    up.public_id
  FROM public.user_profiles up
  WHERE (up.public_id = upper(p_identifier))
     OR (up.user_id IN (
       SELECT au.id FROM auth.users au WHERE au.email = lower(p_identifier)
     ))
  LIMIT 1;
$$;
