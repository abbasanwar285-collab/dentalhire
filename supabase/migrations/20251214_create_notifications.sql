create type notification_type as enum ('status_change', 'new_application', 'system');

create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type notification_type default 'system',
  read boolean default false,
  related_id uuid, -- link to application_id or job_id
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table notifications enable row level security;

-- Policy: Users can view their own notifications
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

-- Policy: System/Functions can insert notifications (or authenticated users sending to others if needed)
-- For now, allow authenticated users to insert (e.g., Clinic Owner notifying Job Seeker)
create policy "Authenticated users can insert notifications"
  on notifications for insert
  to authenticated
  with check (true);

-- Policy: Users can update their own notifications (mark as read)
create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);
