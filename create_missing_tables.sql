-- Supply Requests table
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

-- Tasks table
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

-- Settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    clinic_name TEXT,
    clinic_phone TEXT,
    clinic_address TEXT
);
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
