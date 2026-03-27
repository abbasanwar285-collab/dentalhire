-- Enable RLS for Patient Scans Table if not already enabled
alter table public.patient_scans enable row level security;

-- Create Policy to allow access (Reading and Writing) for all users
-- This matches the configuration of other tables in your project
create policy "Enable all access for all users" on public.patient_scans
for all using (true) with check (true);
