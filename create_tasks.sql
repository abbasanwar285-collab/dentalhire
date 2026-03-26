-- Create tasks table
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
