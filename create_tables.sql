-- Create missing tables for Iris Manager App

-- 1. Users table
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'secretary',
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    color TEXT,
    specialization TEXT,
    salary_type TEXT,
    fixed_salary REAL,
    percentage REAL,
    salary_start_date TEXT,
    bonuses JSONB DEFAULT '[]'::jsonb,
    deductions JSONB DEFAULT '[]'::jsonb,
    salary_notes TEXT
);
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- 2. Supply Requests table
CREATE TABLE IF NOT EXISTS public.app_supply_requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit TEXT,
    urgency TEXT DEFAULT 'normal',
    notes TEXT,
    requested_by_user_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    purchased_at TIMESTAMP WITH TIME ZONE,
    purchase_price REAL
);
ALTER TABLE public.app_supply_requests DISABLE ROW LEVEL SECURITY;

-- 3. Tasks table
CREATE TABLE IF NOT EXISTS public.app_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'normal',
    assigned_to_user_id TEXT,
    created_by_user_id TEXT,
    status TEXT DEFAULT 'pending',
    related_patient_id TEXT,
    due_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    completed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.app_tasks DISABLE ROW LEVEL SECURITY;

-- 4. Settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    clinic_name TEXT,
    clinic_phone TEXT,
    clinic_address TEXT
);
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- 5. Add supply_request_id to expenses_v2
ALTER TABLE public.expenses_v2 ADD COLUMN IF NOT EXISTS supply_request_id TEXT;

-- 6. Add email and date_of_birth to patients_v2 (missing columns)
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE public.patients_v2 ADD COLUMN IF NOT EXISTS last_visit TEXT;
