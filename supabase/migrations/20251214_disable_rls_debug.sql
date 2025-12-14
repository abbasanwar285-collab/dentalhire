-- Disable RLS temporarily to debug Channel Error
begin;
  alter table notifications disable row level security;
  -- Ensure publication is explicitly adding the table again just in case
  alter publication supabase_realtime add table notifications;
commit;
