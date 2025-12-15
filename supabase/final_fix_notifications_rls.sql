-- FINAL FIX RAPID RE-ENABLE RLS
-- Run this to secure the table again while keeping data visible

-- 1. Re-enable RLS (was disabled for testing)
alter table notifications enable row level security;

-- 2. Drop policies to ensure clean slate
drop policy if exists "view_own_notifications" on notifications;
drop policy if exists "update_own_notifications" on notifications;
drop policy if exists "insert_notifications" on notifications;

-- 3. Create View Policy (Authenticated users see their own)
create policy "view_own_notifications"
on notifications for select
to authenticated
using (auth.uid() = user_id);

-- 4. Create Update Policy (Mark as read)
create policy "update_own_notifications"
on notifications for update
to authenticated
using (auth.uid() = user_id);

-- 5. Create Insert Policy (needed for some flows)
create policy "insert_notifications"
on notifications for insert
to authenticated
with check (true);

-- 6. Grant permissions
grant all on notifications to authenticated;
grant all on notifications to service_role;
