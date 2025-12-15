-- ============================================
-- DentalHire - Ensure Avatars Storage Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure 'avatars' bucket exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid conflicts (and ensure latest version)
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Anyone can view avatars" on storage.objects;

-- 3. Re-create Policies

-- Allow authenticated users to upload avatars (INSERT)
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their avatars (UPDATE)
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their avatars (DELETE)
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to avatars (SELECT)
create policy "Anyone can view avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');
