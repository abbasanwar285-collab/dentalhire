-- FIX ALL TABLES PERMISSIONS
-- Run this to ensure Appointments, Expenses, and Inventory allow saving data.

-- 1. Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access for all users" ON public.appointments;
CREATE POLICY "Allow access for all users" ON public.appointments
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access for all users" ON public.expenses;
CREATE POLICY "Allow access for all users" ON public.expenses
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Inventory
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.inventory_items;
CREATE POLICY "Enable all access for all users" ON public.inventory_items
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Scans
ALTER TABLE public.patient_scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for all users" ON public.patient_scans;
CREATE POLICY "Allow all access for all users" ON public.patient_scans
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access for all users" ON public.audit_logs;
CREATE POLICY "Allow access for all users" ON public.audit_logs
FOR ALL TO authenticated USING (true) WITH CHECK (true);
