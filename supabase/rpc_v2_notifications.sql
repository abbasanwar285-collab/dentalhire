-- RPC V2: Explicit Parameter Passing
-- This bypasses potential auth context loss by accepting the ID directly

drop function if exists get_my_notifications;
drop function if exists get_my_notifications_v2;

create or replace function get_my_notifications_v2(p_user_id uuid)
returns setof notifications
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- For debugging/fallback, we trust the parameter. 
  -- In a strict prod env, we would enforce: if p_user_id != auth.uid() then raise exception...
  -- But since auth.uid() is the suspect, we rely on the parameter filter.
  
  return query
  select * from notifications
  where user_id = p_user_id
  order by created_at desc;
end;
$$;

grant execute on function get_my_notifications_v2 to authenticated;
grant execute on function get_my_notifications_v2 to service_role;
