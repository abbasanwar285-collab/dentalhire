-- 8. Allowed Users (Staff Permissions)
create table if not exists public.allowed_users (
  email text primary key,
  name text,
  role text check (role in ('admin', 'doctor', 'assistant')),
  created_at timestamptz default now()
);

-- Enable RLS for Allowed Users
alter table public.allowed_users enable row level security;

-- Create Policy
create policy "Enable all access for all users" on public.allowed_users
for all using (true) with check (true);
