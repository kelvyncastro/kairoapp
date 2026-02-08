-- Fix user_profiles RLS policy to prevent phone number exposure
-- Drop the permissive policy that allows viewing profiles by public_id
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own or admins can view all" ON public.user_profiles;

-- Create strict policy: users can only view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Note: Public profile lookups should use the get_public_user_profiles() RPC function
-- which explicitly excludes sensitive fields like phone_number and birth_date