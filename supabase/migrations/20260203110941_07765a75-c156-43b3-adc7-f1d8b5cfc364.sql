-- Allow users to search for other user profiles by public_id (for inviting to rankings)
CREATE POLICY "Users can view profiles by public_id" 
ON public.user_profiles 
FOR SELECT 
USING (
  -- Users can always see their own profile
  auth.uid() = user_id
  OR
  -- Anyone authenticated can search by public_id (for ranking invites)
  public_id IS NOT NULL
);