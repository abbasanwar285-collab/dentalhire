-- Add missing columns to patients_v2
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS last_visit TEXT;
