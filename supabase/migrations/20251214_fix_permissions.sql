-- Fix Permissions and Publication
begin;

-- 1. Grant permissions to authenticated users (Critical for Realtime/RLS)
grant all on table notifications to postgres, service_role;
grant select, insert, update on table notifications to authenticated;

-- 2. Ensure Publication includes both important tables
-- (In case 'messages' was lost during the previous reset)
alter publication supabase_realtime add table notifications;
-- Try to add messages if not present (ignore error if already present)
do $$
begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then
  null;
end $$;

commit;
