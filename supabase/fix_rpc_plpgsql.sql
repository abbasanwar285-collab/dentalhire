-- FIX RPC: PREVENT INLINING WITH PLPGSQL
-- Use this to strictly enforce Security Definer privileges

drop function if exists get_my_notifications;

create or replace function get_my_notifications()
returns setof notifications
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select * from notifications
  where user_id = auth.uid()
  order by created_at desc;
end;
$$;

-- Grant access
grant execute on function get_my_notifications to authenticated;
grant execute on function get_my_notifications to service_role;
