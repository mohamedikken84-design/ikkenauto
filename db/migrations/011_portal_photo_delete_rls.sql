-- Allow a garage owner to remove only photos belonging to that garage and vehicle.
-- No rows or existing storage files are modified by this migration.
create policy portal_photos_delete on public.portal_vehicle_photos
for delete to authenticated
using (
  exists (
    select 1 from public.portal_dealers d
    where d.id = portal_vehicle_photos.dealer_id
      and d.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.portal_vehicles v
    where v.id = portal_vehicle_photos.vehicle_id
      and v.dealer_id = portal_vehicle_photos.dealer_id
  )
);
grant delete on public.portal_vehicle_photos to authenticated;
create policy portal_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'portal-vehicles'
  and exists (
    select 1 from public.portal_dealers d
    where d.id::text = split_part(storage.objects.name, '/', 1)
      and d.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.portal_vehicles v
    where v.id::text = split_part(storage.objects.name, '/', 2)
      and v.dealer_id::text = split_part(storage.objects.name, '/', 1)
  )
);
