-- Fix ebook_content public exposure: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view ebook content" ON public.ebook_content;
CREATE POLICY "Users can view own ebook content"
ON public.ebook_content
FOR SELECT
USING (auth.uid() = user_id);

-- Add DELETE policy for user_profiles table (GDPR compliance)
CREATE POLICY "Users can delete their own profile"
ON public.user_profiles
FOR DELETE
USING (auth.uid() = user_id);