-- Create table for storing Web Push Subscriptions
create table if not exists public.push_subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    endpoint text not null unique,
    auth_key text not null,
    p256dh_key text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_used_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for faster lookups by user
create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

-- Eanble RLS
alter table public.push_subscriptions enable row level security;

-- Policies

-- Users can insert their own subscriptions
create policy "Users can insert own subscription"
    on public.push_subscriptions for insert
    with check (auth.uid() = user_id);

-- Users can view their own subscriptions (needed for checks)
create policy "Users can view own subscriptions"
    on public.push_subscriptions for select
    using (auth.uid() = user_id);

-- Users can delete their own subscriptions (unsubscribe)
create policy "Users can delete own subscriptions"
    on public.push_subscriptions for delete
    using (auth.uid() = user_id);

-- Service Role (or admin functions) need full access. 
-- By default, service role bypasses RLS, but if using standard client:
-- (Supabase Service Role key bypasses RLS automatically, so no explicit policy needed for Admin API if using service key)
