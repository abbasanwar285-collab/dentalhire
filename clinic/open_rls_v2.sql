-- Enable public access for all tables
-- This fixed version handles the missing 'profiles' table

-- 1. Patients
DROP POLICY IF EXISTS "Enable all access for all users" ON public.patients;
CREATE POLICY "Enable all access for all users" ON public.patients FOR ALL USING (true) WITH CHECK (true);

-- 2. Appointments
DROP POLICY IF EXISTS "Enable all access for all users" ON public.appointments;
CREATE POLICY "Enable all access for all users" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

-- 3. Expenses
DROP POLICY IF EXISTS "Enable all access for all users" ON public.expenses;
CREATE POLICY "Enable all access for all users" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- 4. Inventory
DROP POLICY IF EXISTS "Enable all access for all users" ON public.inventory_items;
CREATE POLICY "Enable all access for all users" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);

-- 5. Patient Scans
DROP POLICY IF EXISTS "Enable all access for all users" ON public.patient_scans;
CREATE POLICY "Enable all access for all users" ON public.patient_scans FOR ALL USING (true) WITH CHECK (true);

-- 6. Audit Logs
DROP POLICY IF EXISTS "Enable all access for all users" ON public.audit_logs;
CREATE POLICY "Enable all access for all users" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. Allowed Users
DROP POLICY IF EXISTS "Enable all access for all users" ON public.allowed_users;
CREATE POLICY "Enable all access for all users" ON public.allowed_users FOR ALL USING (true) WITH CHECK (true);

-- 8. Profiles (Create if missing)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  role text,
  updated_at timestamp with time zone
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for all users" ON public.profiles;
CREATE POLICY "Enable all access for all users" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
