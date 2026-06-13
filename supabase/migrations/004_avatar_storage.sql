-- Create avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;


-- 1. Select Policy: Allow public read access to all avatars
create policy "Allow public read access to avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- 2. Insert Policy: Allow authenticated users to upload files only to a directory named after their user ID
create policy "Allow owners to upload avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and
  (select auth.uid()::text) = (storage.foldername(name))[1]
);

-- 3. Update Policy: Allow authenticated users to update files in their own folder
create policy "Allow owners to update avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars' and
  (select auth.uid()::text) = (storage.foldername(name))[1]
);

-- 4. Delete Policy: Allow authenticated users to delete files in their own folder
create policy "Allow owners to delete avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars' and
  (select auth.uid()::text) = (storage.foldername(name))[1]
);
