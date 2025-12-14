-- Apply Permissions Only (Run this to fix 403/Channel Error)

-- Grant permissions to authenticated users
grant select, insert, update on table notifications to authenticated;
grant all on table notifications to service_role;

-- (We skip 'alter publication' because the error proved it's already there)
