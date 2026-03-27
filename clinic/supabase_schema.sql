-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Allowed Users (Staff)
create table public.allowed_users (
  email text primary key,
  name text not null,
  role text not null check (role in ('admin', 'doctor', 'assistant')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Patients
create table public.patients (
  id text primary key, -- Use text to support existing UUIDs or manual IDs
  name text not null,
  mobile text,
  age integer,
  gender text,
  total_cost numeric default 0,
  paid_amount numeric default 0,
  diagnosis text,
  procedures jsonb default '[]'::jsonb, -- Array of Procedure objects
  notes text,
  
  -- Ortho specific
  ortho_doctor_id text,
  ortho_total_cost numeric default 0,
  ortho_paid_amount numeric default 0,
  ortho_diagnosis text,
  ortho_visits jsonb default '[]'::jsonb,
  
  -- Legacy / Utils
  consultation_fee_paid boolean default false,
  consultation_fee_count integer default 0,
  payments jsonb default '[]'::jsonb,
  
  is_debt_only boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Appointments
create table public.appointments (
  id text primary key,
  patient_id text references public.patients(id) on delete cascade,
  patient_name text,
  doctor_id text,
  date text not null, -- YYYY-MM-DD
  time text not null,
  type text,
  notes text,
  status text check (status in ('confirmed', 'arrived', 'completed', 'cancelled', 'pending')),
  price numeric,
  assistant_id text, -- Added
  completed_at text, -- Added
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Expenses
create table public.expenses (
  id text primary key,
  amount numeric not null,
  category text,
  description text,
  date text not null,
  timestamp bigint, -- Added
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Inventory Items
create table public.inventory_items (
  id text primary key,
  name text not null,
  type text, -- Category
  quantity integer default 0,
  unit text,
  min_stock integer default 5,
  expiry_date text,
  price numeric default 0,
  supplier text,
  last_restocked text,
  image_url text,
  image_thumbnail text,
  image text, -- Legacy/Backup
  notes text,
  auto_decrement boolean default false,
  consumption_rate numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Patient Scans
create table public.patient_scans (
  id text primary key,
  patient_id text references public.patients(id) on delete cascade,
  type text,
  file_url text,
  file_path text, -- Added
  thumbnail_url text,
  file_name text,
  notes text,
  scan_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Audit Logs
create table public.audit_logs (
  id text primary key,
  doctor_id text,
  action text not null,
  entity_type text,
  entity_id text,
  patient_id text,
  patient_name text,
  description text,
  old_value text, -- JSON string or text
  new_value text, -- JSON string or text
  timestamp bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.allowed_users enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.expenses enable row level security;
alter table public.inventory_items enable row level security;
alter table public.patient_scans enable row level security;
alter table public.audit_logs enable row level security;

-- Create Policies (Open for now as per likely requirement for simple migration, usually authenticated users)
-- Change 'anon' to 'authenticated' if you want to restrict public access later.
create policy "Enable all access for all users" on public.allowed_users for all using (true) with check (true);
create policy "Enable all access for all users" on public.patients for all using (true) with check (true);
create policy "Enable all access for all users" on public.appointments for all using (true) with check (true);
create policy "Enable all access for all users" on public.expenses for all using (true) with check (true);
create policy "Enable all access for all users" on public.inventory_items for all using (true) with check (true);
create policy "Enable all access for all users" on public.patient_scans for all using (true) with check (true);
create policy "Enable all access for all users" on public.audit_logs for all using (true) with check (true);

-- Enable Realtime
alter publication supabase_realtime add table public.patients;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.inventory_items;
alter publication supabase_realtime add table public.expenses;
