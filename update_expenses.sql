-- Add supply_request_id to expenses_v2
ALTER TABLE public.expenses_v2 ADD COLUMN IF NOT EXISTS supply_request_id TEXT;
