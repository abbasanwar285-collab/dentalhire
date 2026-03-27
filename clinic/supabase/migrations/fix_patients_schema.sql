-- Add missing columns to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS ortho_paid_amount numeric default 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS ortho_visits jsonb default '[]'::jsonb;

-- Ensure RLS allows access (already covered by generic policy but good to verify)
