-- Create job_drafts table
create table if not exists job_drafts (
  id uuid default gen_random_uuid() primary key,
  clinic_id uuid references clinics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null,
  status text default 'draft',
  step_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table job_drafts enable row level security;

-- Policies
create policy "Users can view their own drafts"
  on job_drafts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own drafts"
  on job_drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own drafts"
  on job_drafts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own drafts"
  on job_drafts for delete
  using (auth.uid() = user_id);
