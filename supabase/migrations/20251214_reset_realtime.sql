-- Reset Realtime configuration for notifications table
begin;

-- 1. Remove table from publication (if exists/error ignored) for clean slate
alter publication supabase_realtime drop table notifications;

-- 2. Add table back to publication
alter publication supabase_realtime add table notifications;

-- 3. Set Replica Identity to FULL to ensure all events (Update/Delete) are sent with full data
alter table notifications replica identity full;

commit;
