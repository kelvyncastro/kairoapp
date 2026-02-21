
-- Create a secure function to update checked_items on shared lists (no auth required)
CREATE OR REPLACE FUNCTION public.update_shared_grocery_checked(
  p_share_code text,
  p_checked_items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE grocery_lists
  SET checked_items = p_checked_items,
      updated_at = now()
  WHERE share_code = p_share_code;
END;
$$;
