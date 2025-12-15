-- MASTER FIX: INTELLIGENT NOTIFICATION SYSTEM
-- Run this script in Supabase SQL Editor to fix EVERYTHING at once.

-- 1. Reset: Disable RLS and Drop all existing policies and functions
alter table notifications disable row level security;
drop policy if exists "view_own_notifications" on notifications;
drop policy if exists "update_own_notifications" on notifications;
drop policy if exists "insert_notifications" on notifications;
drop policy if exists "Users can view own notifications" on notifications;
drop function if exists get_my_notifications;

-- 2. "Smart Fetch": Create Secure RPC Function (Bypasses Table RLS for fetching)
create or replace function get_my_notifications()
returns setof notifications
language sql
security definer -- RUNS WITH SUPERUSER PRIVILEGES
set search_path = public
as $$
  select * from notifications
  where user_id = auth.uid()
  order by created_at desc;
$$;

-- Grant execution to authenticated users
grant execute on function get_my_notifications to authenticated;
grant execute on function get_my_notifications to service_role;

-- 3. "Smart Security": Re-enable RLS for Realtime & Client Safety
alter table notifications enable row level security;

-- Policy: Authenticated users can SEE their own notifications (explicit UUID check)
create policy "allow_select_own"
on notifications for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Authenticated users can UPDATE (mark as read) their own
create policy "allow_update_own"
on notifications for update
to authenticated
using (auth.uid() = user_id);

-- Policy: Authenticated users can INSERT (for system events)
create policy "allow_insert_authenticated"
on notifications for insert
to authenticated
with check (true);

-- 4. Final Permissions Grant
grant all on notifications to authenticated;
grant all on notifications to service_role;

-- 5. Ensure Realtime is Active
alter publication supabase_realtime add table notifications;
-- Note: If this line fails, it means it's already active (which is good). Ignore the error.
