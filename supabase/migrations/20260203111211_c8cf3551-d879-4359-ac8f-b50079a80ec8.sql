-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view profiles by public_id" ON public.user_profiles;

-- Drop the existing restrictive policy first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

-- Create a single combined policy that allows:
-- 1. Users to see their own profile
-- 2. Authenticated users to search for profiles by public_id (for ranking invites)
CREATE POLICY "Users can view own or search by public_id" 
ON public.user_profiles 
FOR SELECT 
USING (
  auth.uid() = user_id
  OR
  (auth.uid() IS NOT NULL AND public_id IS NOT NULL)
);