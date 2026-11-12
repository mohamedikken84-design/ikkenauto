-- Correct the accidental reference to portal_dealers.name in the storage RLS policy.
-- storage.objects.name is the path; the first segment must be an owned garage UUID.
drop policy if exists garage_media_read_by_owner_or_admin on storage.objects;
drop policy if exists garage_media_upload_by_owner on storage.objects;

create policy garage_media_read_by_owner_or_admin on storage.objects
for select to authenticated
using (
 bucket_id = 'portal-garage-media'
 and (
   exists (select 1 from public.portal_dealers d
     where d.id::text = split_part(storage.objects.name,'/',1)
       and d.owner_id = (select auth.uid()))
   or exists (select 1 from public.portal_admins a
     where a.user_id = (select auth.uid()))
 )
);

create policy garage_media_upload_by_owner on storage.objects
for insert to authenticated
with check (
 bucket_id = 'portal-garage-media'
 and exists (select 1 from public.portal_dealers d
   where d.id::text = split_part(storage.objects.name,'/',1)
     and d.owner_id = (select auth.uid()))
);
