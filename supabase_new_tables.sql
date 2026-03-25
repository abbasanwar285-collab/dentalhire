-- =============================================
-- New tables for the Iris Manager App (v2)
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. App Users (RBAC system - replaces allowed_users)
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'secretary',
    permissions JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TEXT,
    color TEXT,
    specialization TEXT,
    salary_type TEXT,
    fixed_salary NUMERIC,
    percentage NUMERIC,
    salary_start_date INTEGER,
    bonuses JSONB DEFAULT '[]'::jsonb,
    deductions JSONB DEFAULT '[]'::jsonb,
    salary_notes TEXT
);

-- 2. App Supply Requests
CREATE TABLE IF NOT EXISTS public.app_supply_requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit TEXT,
    urgency TEXT DEFAULT 'normal',
    notes TEXT,
    requested_by_user_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    purchased_at TEXT,
    purchase_price NUMERIC
);

-- 3. App Tasks
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
    created_at TEXT,
    completed_at TEXT
);

-- 4. App Waiting Room
CREATE TABLE IF NOT EXISTS public.app_waiting_room (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    patient_name TEXT,
    doctor_id TEXT,
    doctor_name TEXT,
    appointment_id TEXT,
    arrival_time TEXT,
    status TEXT DEFAULT 'waiting',
    notes TEXT
);

-- 5. App Arrival Records
CREATE TABLE IF NOT EXISTS public.app_arrival_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    appointment_id TEXT,
    scheduled_time TEXT,
    scheduled_date TEXT,
    actual_arrival_time TEXT,
    difference_minutes INTEGER,
    created_at TEXT,
    session_start_time TEXT,
    session_end_time TEXT
);

-- 6. App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    clinic_name TEXT DEFAULT 'Iris Clinic',
    clinic_phone TEXT,
    clinic_address TEXT
);

-- =============================================
-- Disable RLS on all new tables (open access)
-- =============================================
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_supply_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_waiting_room DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_arrival_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Also ensure existing tables have RLS disabled
-- =============================================
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Enable Realtime on new tables
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_supply_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_tasks;

-- Insert default settings row
INSERT INTO public.app_settings (id, clinic_name) 
VALUES ('default', 'Iris Clinic') 
ON CONFLICT (id) DO NOTHING;
