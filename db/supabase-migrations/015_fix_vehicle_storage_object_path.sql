-- Non-destructive repair for portal-vehicles Storage RLS.
-- The original policies resolved unqualified "name" to portal_dealers.name
-- inside a subquery instead of storage.objects.name (the object path).
-- Preserve private buckets and grant only owners access to their own photos.
-- Apply only after inspecting existing policies; no data is removed.
begin;

alter policy portal_photo_read on storage.objects
using (
  bucket_id = 'portal-vehicles'
  and (
    exists (
      select 1 from public.portal_dealers d
      where d.id::text = split_part(storage.objects.name, '/', 1)
        and d.owner_id = (select auth.uid())
    )
    or exists (
      select 1 from public.portal_admins a
      where a.user_id = (select auth.uid())
    )
  )
);

alter policy portal_photo_upload on storage.objects
with check (
  bucket_id = 'portal-vehicles'
  and exists (
    select 1
    from public.portal_dealers d
    join public.portal_vehicles v on v.dealer_id = d.id
    where d.id::text = split_part(storage.objects.name, '/', 1)
      and v.id::text = split_part(storage.objects.name, '/', 2)
      and d.owner_id = (select auth.uid())
  )
);

commit;
