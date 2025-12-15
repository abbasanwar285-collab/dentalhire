-- FORCE FIX RLS POLICIES
-- Run this in Supabase SQL Editor

-- 1. Enable RLS
alter table notifications enable row level security;

-- 2. Drop all existing policies to avoid conflicts
drop policy if exists "Users can view own notifications" on notifications;
drop policy if exists "Authenticated users can insert notifications" on notifications;
drop policy if exists "Users can update own notifications" on notifications;
drop policy if exists "view_own_notifications" on notifications;
drop policy if exists "insert_notifications" on notifications;
drop policy if exists "update_own_notifications" on notifications;

-- 3. Create permissive policies for authenticated users
-- Allow users to view their own notifications
create policy "view_own_notifications"
on notifications for select
to authenticated
using (auth.uid() = user_id);

-- Allow system/RPC to insert (handled by Security Definer usually, but this helps clients)
create policy "insert_notifications"
on notifications for insert
to authenticated
with check (true);

-- Allow users to mark their own notifications as read
create policy "update_own_notifications"
on notifications for update
to authenticated
using (auth.uid() = user_id);

-- 4. Grant permissions to authenticated role (CRUD)
grant all on notifications to authenticated;
grant all on notifications to service_role;

-- 5. Force Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for all tables;
commit;
-- OR if you want to be specific:
-- alter publication supabase_realtime add table notifications;
