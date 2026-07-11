-- 0006_storage_architect_photos.sql
-- Create the architect-photos bucket + RLS policies.
-- Requires the storage schema (provided by supabase/storage-api), so this MUST run
-- AFTER the storage container has performed its own schema init.
-- Idempotent: uses on-conflict + drop-policy-if-exists.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'architect-photos',
  'architect-photos',
  true,
  5 * 1024 * 1024,                                      -- 5 MB cap per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone (incl. anon) can read — photos appear on the public architects landing.
drop policy if exists "architect photos public read" on storage.objects;
create policy "architect photos public read"
  on storage.objects for select
  using (bucket_id = 'architect-photos');

-- Authenticated users can write only inside their own user-id-prefixed folder.
-- Path convention: architect-photos/{auth.uid()}/{anything}.{ext}
drop policy if exists "architect photos owner insert" on storage.objects;
create policy "architect photos owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'architect-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "architect photos owner update" on storage.objects;
create policy "architect photos owner update"
  on storage.objects for update
  using (
    bucket_id = 'architect-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "architect photos owner delete" on storage.objects;
create policy "architect photos owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'architect-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
