-- 017: additive indexes identified by Supabase database advisor on 2026-11-12.
-- No deletes, RLS changes, or data migration. Keep existing indexes.
CREATE INDEX IF NOT EXISTS portal_directory_claims_user_idx ON public.portal_directory_claims (user_id);
CREATE INDEX IF NOT EXISTS portal_leads_dealer_created_idx ON public.portal_leads (dealer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS portal_leads_vehicle_idx ON public.portal_leads (vehicle_id);
CREATE INDEX IF NOT EXISTS portal_photo_dealer_created_idx ON public.portal_vehicle_photos (dealer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS portal_photo_vehicle_created_idx ON public.portal_vehicle_photos (vehicle_id,created_at);
CREATE INDEX IF NOT EXISTS portal_vehicles_make_catalog_idx ON public.portal_vehicles (catalog_make_id);
CREATE INDEX IF NOT EXISTS portal_vehicles_generation_catalog_idx ON public.portal_vehicles (catalog_generation_id);
CREATE INDEX IF NOT EXISTS portal_vehicles_powertrain_catalog_idx ON public.portal_vehicles (catalog_powertrain_id);
CREATE INDEX IF NOT EXISTS portal_vehicles_trim_catalog_idx ON public.portal_vehicles (catalog_trim_id);
CREATE INDEX IF NOT EXISTS portal_vehicles_dealer_fuel_price_idx ON public.portal_vehicles (dealer_id,fuel,price_eur);
CREATE INDEX IF NOT EXISTS portal_vehicles_specs_gin_idx ON public.portal_vehicles USING gin (specifications jsonb_path_ops);
