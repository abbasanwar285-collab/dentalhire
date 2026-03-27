-- Create the patient_scans table
create table if not exists public.patient_scans (
    id uuid not null default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    file_name text not null,
    file_url text not null,
    file_path text not null,
    scan_date timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    primary key (id)
);

-- Enable RLS
alter table public.patient_scans enable row level security;

-- Policies for patient_scans
-- Allow read access to authenticated users
create policy "Enable read access for authenticated users" 
on public.patient_scans for select 
to authenticated 
using (true);

-- Allow insert access to authenticated users (including service role/admin)
create policy "Enable insert access for authenticated users" 
on public.patient_scans for insert 
to authenticated 
with check (true);

-- Allow update/delete to authenticated users
create policy "Enable update/delete for authenticated users" 
on public.patient_scans for all 
to authenticated 
using (true);

-- Storage Setup (If not already created)
-- Note: Creating storage buckets via SQL is supported in Supabase
insert into storage.buckets (id, name, public)
values ('scans', 'scans', true)
on conflict (id) do nothing;

-- Storage Policies
-- Allow public read access to the scans bucket
create policy "Give public access to scans"
on storage.objects for select
to public
using (bucket_id = 'scans');

-- Allow authenticated uploads
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (bucket_id = 'scans');

-- Allow authenticated updates/deletes
create policy "Allow authenticated updates"
on storage.objects for update
to authenticated
using (bucket_id = 'scans');

create policy "Allow authenticated deletes"
on storage.objects for delete
to authenticated
using (bucket_id = 'scans');
