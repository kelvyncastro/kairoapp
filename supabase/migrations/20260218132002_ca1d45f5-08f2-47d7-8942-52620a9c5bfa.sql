-- Protect the supreme admin (Arthur Alberti) from having admin role removed via database trigger
CREATE OR REPLACE FUNCTION public.prevent_supreme_admin_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supreme_admin_id UUID := 'a9948ffd-f585-4f9a-ac6c-7496d48ceb6b'::UUID;
BEGIN
  IF OLD.user_id = supreme_admin_id AND OLD.role = 'admin' THEN
    RAISE EXCEPTION 'Cannot remove supreme admin privileges';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER protect_supreme_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_supreme_admin_removal();