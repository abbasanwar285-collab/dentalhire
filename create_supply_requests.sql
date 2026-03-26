-- Create supply requests table
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
