-- Create settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    clinic_name TEXT,
    clinic_phone TEXT,
    clinic_address TEXT
);
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
