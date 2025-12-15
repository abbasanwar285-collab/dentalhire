-- Create RPC to fetch notifications securely (Bypassing RLS for Select)
create or replace function get_my_notifications()
returns setof notifications
language sql
security definer
set search_path = public
as $$
  select * from notifications
  where user_id = auth.uid()
  order by created_at desc;
$$;

-- Grant access
grant execute on function get_my_notifications() to authenticated;
grant execute on function get_my_notifications() to service_role;
