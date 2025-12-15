-- Ensure table exists with correct schema
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null, -- using text to avoid enum issues
  read boolean default false,
  data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table notifications enable row level security;

-- DROP existing policies to completely reset
drop policy if exists "Users can view own notifications" on notifications;
drop policy if exists "Authenticated users can insert notifications" on notifications;
drop policy if exists "Users can update own notifications" on notifications;
drop policy if exists "Enable all for authenticated" on notifications;
drop policy if exists "Anyone can insert" on notifications;

-- RE-CREATE Policies

-- 1. VIEW: Users see only their own notifications
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

-- 2. INSERT: Any authenticated user can insert a notification for ANYONE
-- This is critical for Clinic -> Job Seeker notification flow
create policy "Authenticated users can insert notifications"
  on notifications for insert
  to authenticated
  with check (true);

-- 3. UPDATE: Users can mark THEIR OWN notifications as read
create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table notifications;
