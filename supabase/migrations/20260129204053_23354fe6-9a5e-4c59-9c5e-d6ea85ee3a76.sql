-- Add icon column to finance_sectors
ALTER TABLE public.finance_sectors 
ADD COLUMN IF NOT EXISTS icon text DEFAULT 'wallet';

-- Update existing sectors with appropriate default icons based on name
UPDATE public.finance_sectors SET icon = 'shopping-bag' WHERE LOWER(name) LIKE '%mercado%';
UPDATE public.finance_sectors SET icon = 'car' WHERE LOWER(name) LIKE '%transporte%';
UPDATE public.finance_sectors SET icon = 'credit-card' WHERE LOWER(name) LIKE '%cartão%' OR LOWER(name) LIKE '%cartao%';
UPDATE public.finance_sectors SET icon = 'gamepad' WHERE LOWER(name) LIKE '%lazer%' OR LOWER(name) LIKE '%entretenimento%';
UPDATE public.finance_sectors SET icon = 'chart-line' WHERE LOWER(name) LIKE '%investimento%';
UPDATE public.finance_sectors SET icon = 'utensils' WHERE LOWER(name) LIKE '%alimentação%' OR LOWER(name) LIKE '%alimentacao%';
UPDATE public.finance_sectors SET icon = 'graduation-cap' WHERE LOWER(name) LIKE '%educação%' OR LOWER(name) LIKE '%educacao%';
UPDATE public.finance_sectors SET icon = 'shopping-bag' WHERE LOWER(name) LIKE '%vestuário%' OR LOWER(name) LIKE '%vestuario%';