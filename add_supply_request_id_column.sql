-- Run this in Supabase SQL Editor to add the missing column
-- This allows expenses to link back to supply requests

ALTER TABLE public.expenses_v2
ADD COLUMN IF NOT EXISTS supply_request_id TEXT;
