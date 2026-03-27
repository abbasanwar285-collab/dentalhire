-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('admin', 'doctor', 'assistant')) default 'doctor',
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, new.email, 'doctor', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
-- Drop if exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- UPDATE OTHER TABLES RLS POLICIES

-- Patients: Everyone can View. Only Admin/Doctor can Insert/Update/Delete.
drop policy if exists "Allow access for all users" on public.patients;

create policy "Everyone can view patients" on public.patients
  for select using (true); -- Ideally restrict to authenticated, but keeping broad for now as asked

create policy "Admin and Doctor can modify patients" on public.patients
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'doctor')
    )
  );

-- Appointments: Everyone can Read/Write (Assistants need this).
-- (No change needed strictly, but good to be explicit if we want)

-- Expenses: Only Admin can View/Manage.
drop policy if exists "Allow access for all users" on public.expenses;

create policy "Only Admins can access expenses" on public.expenses
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Helper to check if user is admin (optional, for use in other policies)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;
