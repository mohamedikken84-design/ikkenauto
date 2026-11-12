-- Defensive correction of an existing RLS policy. No customer data is modified.
-- Previously the photo vehicle/dealer predicate compared v.dealer_id to itself.
-- This allows only a dealer-owned vehicle to receive a dealer-owned photo row.
drop policy if exists portal_photos_insert on public.portal_vehicle_photos;
create policy portal_photos_insert on public.portal_vehicle_photos
for insert to authenticated
with check (
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
  and portal_vehicle_photos.storage_path like
      portal_vehicle_photos.dealer_id::text || '/' ||
      portal_vehicle_photos.vehicle_id::text || '/%'
);
