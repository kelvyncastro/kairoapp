-- Function to create default finance sectors for a user
CREATE OR REPLACE FUNCTION public.create_default_finance_sectors(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if user doesn't have any sectors yet
  IF NOT EXISTS (SELECT 1 FROM finance_sectors WHERE user_id = p_user_id) THEN
    INSERT INTO finance_sectors (user_id, name, color_label, icon) VALUES
      (p_user_id, 'Mercado', '#22c55e', 'shopping-bag'),
      (p_user_id, 'Transporte', '#3b82f6', 'car'),
      (p_user_id, 'Cartão', '#8b5cf6', 'credit-card'),
      (p_user_id, 'Lazer e Entretenimento', '#f97316', 'gamepad'),
      (p_user_id, 'Investimentos', '#eab308', 'chart-line'),
      (p_user_id, 'Vestuário', '#ec4899', 'shopping-bag'),
      (p_user_id, 'Educação', '#06b6d4', 'graduation-cap'),
      (p_user_id, 'Alimentação', '#ef4444', 'utensils');
  END IF;
END;
$$;

-- Trigger function to create default sectors on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_finance_sectors()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_default_finance_sectors(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (runs after insert)
DROP TRIGGER IF EXISTS on_auth_user_created_finance_sectors ON auth.users;
CREATE TRIGGER on_auth_user_created_finance_sectors
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_finance_sectors();

-- Add default sectors to all existing users who don't have any
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM create_default_finance_sectors(user_record.id);
  END LOOP;
END;
$$;