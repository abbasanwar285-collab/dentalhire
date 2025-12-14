-- Ensure user_id column exists in cvs table (if missing, it causes 400 Bad Request in useJobStore)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'cvs' and column_name = 'user_id') then
    alter table cvs add column user_id uuid references users(id) on delete cascade;
  end if;
end $$;
