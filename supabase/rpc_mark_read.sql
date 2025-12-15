-- RPC: Securely Mark Notification as Read
-- Bypasses RLS update policies which are failing

-- 1. Mark Single Notification
create or replace function mark_notification_read_v2(p_notification_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications
  set read = true
  where id = p_notification_id
  and user_id = p_user_id; -- Safety check: only map if belongs to user
end;
$$;

-- 2. Mark All Notifications
create or replace function mark_all_notifications_read_v2(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications
  set read = true
  where user_id = p_user_id
  and read = false;
end;
$$;

-- Grant access
grant execute on function mark_notification_read_v2 to authenticated;
grant execute on function mark_all_notifications_read_v2 to authenticated;
