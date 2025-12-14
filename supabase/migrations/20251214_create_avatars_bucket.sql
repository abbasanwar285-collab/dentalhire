-- Create a public bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public access to view avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' );

-- Allow users to update their own avatars (optional, depends on file naming)
create policy "Users can update their own avatars"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'avatars' && auth.uid() = owner );
