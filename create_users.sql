-- Create users table
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
