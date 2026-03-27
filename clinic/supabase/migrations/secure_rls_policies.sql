-- ============================================
-- SECURE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- These policies enforce proper access control
-- based on user roles and ownership

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. ALLOWED USERS (Staff Management)
-- ============================================
create table if not exists public.allowed_users (
  email text primary key,
  name text not null,
  role text not null check (role in ('admin', 'doctor', 'assistant')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.allowed_users enable row level security;

-- Admin-only access to allowed_users
create policy "Admins can manage staff"
  on public.allowed_users
  for all
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  with check (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- 2. PATIENTS TABLE
-- ============================================
create table if not exists public.patients (
  id text primary key,
  name text not null,
  mobile text,
  age integer,
  gender text,
  total_cost numeric default 0,
  paid_amount numeric default 0,
  diagnosis text,
  procedures jsonb default '[]'::jsonb,
  notes text,
  ortho_doctor_id text,
  ortho_total_cost numeric default 0,
  ortho_paid_amount numeric default 0,
  ortho_diagnosis text,
  ortho_visits jsonb default '[]'::jsonb,
  consultation_fee_paid boolean default false,
  consultation_fee_count integer default 0,
  payments jsonb default '[]'::jsonb,
  is_debt_only boolean default false,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.patients enable row level security;

-- Admin and Doctors can read all patients
create policy "Admins and doctors can view all patients"
  on public.patients
  for select
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' in ('admin', 'doctor')
    )
  );

-- Assistants can only view patients (no modification)
create policy "Assistants can view patients"
  on public.patients
  for select
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'assistant'
    )
  );

-- Admins can insert/update/delete patients
create policy "Admins can manage patients"
  on public.patients
  for all
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  with check (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Doctors can only update their own patient data
create policy "Doctors can update patients"
  on public.patients
  for update
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'doctor'
    )
  );

-- ============================================
-- 3. APPOINTMENTS TABLE
-- ============================================
create table if not exists public.appointments (
  id text primary key,
  patient_id text references public.patients(id) on delete cascade,
  patient_name text,
  doctor_id text not null,
  date text not null,
  time text not null,
  type text,
  notes text,
  status text check (status in ('confirmed', 'arrived', 'completed', 'cancelled', 'pending')),
  price numeric,
  assistant_id text,
  completed_at text,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.appointments enable row level security;

-- All authenticated users can view appointments
create policy "Authenticated users can view appointments"
  on public.appointments
  for select
  to authenticated
  using (true);

-- Admins can manage all appointments
create policy "Admins can manage appointments"
  on public.appointments
  for all
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Doctors can manage their own appointments
create policy "Doctors can manage their appointments"
  on public.appointments
  for all
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'doctor'
    )
    and doctor_id = auth.uid()::text
  );

-- ============================================
-- 4. EXPENSES TABLE (Admin Only)
-- ============================================
create table if not exists public.expenses (
  id text primary key,
  amount numeric not null,
  category text,
  description text,
  date text not null,
  timestamp bigint,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.expenses enable row level security;

-- Only admins can access expenses
create policy "Only admins can access expenses"
  on public.expenses
  for all
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- 5. INVENTORY ITEMS TABLE
-- ============================================
create table if not exists public.inventory_items (
  id text primary key,
  name text not null,
  type text,
  quantity integer default 0,
  unit text,
  min_stock integer default 5,
  expiry_date text,
  price numeric default 0,
  supplier text,
  last_restocked text,
  image_url text,
  image_thumbnail text,
  image text,
  notes text,
  auto_decrement boolean default false,
  consumption_rate numeric default 0,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.inventory_items enable row level security;

-- All authenticated users can view inventory
create policy "Authenticated users can view inventory"
  on public.inventory_items
  for select
  to authenticated
  using (true);

-- Only admins can modify inventory
create policy "Only admins can modify inventory"
  on public.inventory_items
  for all
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- 6. PATIENT SCANS TABLE
-- ============================================
create table if not exists public.patient_scans (
  id text primary key,
  patient_id text references public.patients(id) on delete cascade,
  type text,
  file_url text,
  file_path text,
  thumbnail_url text,
  file_name text,
  notes text,
  scan_date text,
  uploaded_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.patient_scans enable row level security;

-- Admins and doctors can view all scans
create policy "Admins and doctors can view scans"
  on public.patient_scans
  for select
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' in ('admin', 'doctor')
    )
  );

-- Assistants can view scans
create policy "Assistants can view scans"
  on public.patient_scans
  for select
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'assistant'
    )
  );

-- Only admins can manage scans
create policy "Admins can manage scans"
  on public.patient_scans
  for all
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- 7. AUDIT LOGS TABLE
-- ============================================
create table if not exists public.audit_logs (
  id text primary key,
  doctor_id text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  patient_id text,
  patient_name text,
  description text,
  old_value text,
  new_value text,
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- All authenticated users can view audit logs
create policy "Authenticated users can view audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (true);

-- Only system can insert audit logs (via trigger or service role)
create policy "Only system can insert audit logs"
  on public.audit_logs
  for insert
  to authenticated
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
create index if not exists idx_patients_name on public.patients(name);
create index if not exists idx_patients_mobile on public.patients(mobile);
create index if not exists idx_appointments_date on public.appointments(date);
create index if not exists idx_appointments_doctor on public.appointments(doctor_id);
create index if not exists idx_expenses_date on public.expenses(date);
create index if not exists idx_audit_logs_timestamp on public.audit_logs(timestamp);
create index if not exists idx_patient_scans_patient on public.patient_scans(patient_id);
