-- Nuclear Rebuild of Notifications System
begin;

-- 1. Drop existing objects to clear any stale state
drop publication if exists supabase_realtime; -- We'll recreate/alter it carefully
create publication supabase_realtime; -- Ensure it exists

drop table if exists notifications cascade;
drop type if exists notification_type cascade;

-- 2. Re-create Type
create type notification_type as enum ('status_change', 'new_application', 'system');

-- 3. Re-create Table
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type notification_type default 'system',
  read boolean default false,
  related_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS
alter table notifications enable row level security;

-- 5. Policies
-- View: Users see their own
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

-- Insert: Allow inserting if you are authenticated (covers Clinic -> Seeker)
create policy "Authenticated users can insert notifications"
  on notifications for insert
  to authenticated
  with check (true);

-- Update: Users can mark as read
create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- 6. Realtime Configuration (Critical Step)
-- Add table to publication
alter publication supabase_realtime add table notifications;

-- Set Replica Identity to FULL (Best for realtime reliability)
alter table notifications replica identity full;

commit;
