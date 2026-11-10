UPDATE public.vehicle_private
SET license_plate = upper(regexp_replace(license_plate, '[^A-Za-z0-9]', '', 'g'))
WHERE license_plate IS NOT NULL;

UPDATE public.vehicle_private
SET license_plate = NULL
WHERE license_plate IS NOT NULL AND license_plate !~ '^[A-Z0-9]{2,12}$';

ALTER TABLE public.vehicle_private DROP CONSTRAINT IF EXISTS vehicle_private_license_plate_format;
ALTER TABLE public.vehicle_private
  ADD CONSTRAINT vehicle_private_license_plate_format
  CHECK (license_plate IS NULL OR license_plate ~ '^[A-Z0-9]{2,12}$');
