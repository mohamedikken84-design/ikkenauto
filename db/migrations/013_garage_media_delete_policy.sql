-- Allow replacing/deleting media belonging to a garage's own private bucket.
create policy garage_media_delete_by_owner on storage.objects
for delete to authenticated
using (
 bucket_id = 'portal-garage-media'
 and exists (select 1 from public.portal_dealers d
   where d.id::text = split_part(storage.objects.name,'/',1)
     and d.owner_id = (select auth.uid()))
);
