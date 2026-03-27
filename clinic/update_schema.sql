-- Run this in your Supabase SQL Editor to add the missing columns
-- We use IF NOT EXISTS to avoid errors if you run it multiple times

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS assistant_id text,
ADD COLUMN IF NOT EXISTS completed_at text;

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS timestamp bigint;

ALTER TABLE public.patient_scans 
ADD COLUMN IF NOT EXISTS file_path text;
