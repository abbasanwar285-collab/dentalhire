-- Corrected Nuclear Rebuild
begin;

-- 1. Drop EVERYTHING related to notifications first
drop publication if exists supabase_realtime; 
create publication supabase_realtime; 

-- Cascade will remove the table if it depends on the type, 
-- BUT we drop table first just to be sure.
drop table if exists notifications cascade;

-- CRITICAL: Drop the type explicitly so we can recreate it
drop type if exists notification_type cascade;

-- 2. Now it's safe to create the type
create type notification_type as enum ('status_change', 'new_application', 'system');

-- 3. Create Table
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
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert notifications"
  on notifications for insert
  to authenticated
  with check (true);

create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- 6. Realtime Configuration
alter publication supabase_realtime add table notifications;
alter table notifications replica identity full;

commit;
