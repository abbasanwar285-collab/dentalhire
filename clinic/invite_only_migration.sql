-- Create allowed_users table
create table if not exists public.allowed_users (
  email text primary key,
  role text check (role in ('admin', 'doctor', 'assistant')) not null,
  name text,
  created_at timestamptz default now()
);

-- Enable RLS (Only admins can read/write this table)
alter table public.allowed_users enable row level security;

-- Drop policy if exists to avoid error on re-run
drop policy if exists "Admins can manage allowed_users" on public.allowed_users;

create policy "Admins can manage allowed_users" on public.allowed_users
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Update the handle_new_user function to enforce the whitelist
create or replace function public.handle_new_user()
returns trigger as $$
declare
  allowed_role text;
  allowed_name text;
begin
  -- 1. Check if email is in allowed_users
  select role, name into allowed_role, allowed_name
  from public.allowed_users
  where email = new.email;

  if allowed_role is null then
    raise exception 'Email not authorized. Please contact the administrator.';
  end if;

  -- 2. Create profile with the assigned role
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id, 
    new.email, 
    allowed_role, 
    coalesce(allowed_name, new.raw_user_meta_data->>'full_name', 'New User')
  );

  return new;
end;
$$ language plpgsql security definer;
