-- V2 Schema matching the SQLite implementation

CREATE TABLE IF NOT EXISTS public.patients_v2 (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    medical_history TEXT,
    general_notes TEXT,
    treatment_plans JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.appointments_v2 (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    patient_name TEXT,
    doctor_id TEXT,
    doctor_name TEXT,
    date TEXT,
    time TEXT,
    treatment TEXT,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.expenses_v2 (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    category TEXT,
    description TEXT,
    date TEXT,
    created_by_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.users_v2 (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'secretary',
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Note: Ensure RLS is disabled across all tables for initial frontend-direct setups utilizing standard Service Roles
ALTER TABLE public.patients_v2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_v2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses_v2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_v2 DISABLE ROW LEVEL SECURITY;
