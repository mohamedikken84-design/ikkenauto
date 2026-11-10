-- Bijgewerkte architect-spec (10 nov 2026), ter vervanging van de eerdere draft.
-- Het buitenste BEGIN/COMMIT doet scripts/migrate.ts, samen met schema_migrations.
-- CREATE ROLE gebeurt in scripts/setup-local-db.sh, buiten een transactie.

-- IKKENAUTO.be — migratie dealerportaal (Supabase/PostgreSQL)
-- Doelbranch: dealerportaal-v1, bovenop PR #4 (001_identity … 005_registration_auth).
-- Bron: PR #2 (cursor/dealer-stock-datamodel-6ada @ 975f0ed) en PR #4
--       (cursor/registratie-auth-6ada @ 02378a8).
-- Niet toepassen op main. Geen DNS, geen livegang.
--
-- Vereiste: auth.users + auth.uid()/auth.jwt() (Supabase) of de lokale teststubs.
-- Deze file wijzigt bestaande tabellen uit 001–005 en voegt RLS/storage toe.
-- Extra t.o.v. de eerste draft: listingvelden, vehicle_private (VIN),
-- platform_admins (bron van waarheid, niet JWT), leads, vehicle_events, audit_log.
-- Verificatie zet is_public niet automatisch.
-- Bestaande lokale testdata in public.users wordt niet naar auth.users gemigreerd.


DO $$
BEGIN
  IF to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'auth.users ontbreekt. Pas toe op Supabase of laad eerst de teststubs.';
  END IF;
  IF to_regclass('public.dealers') IS NULL AND to_regclass('public.garages') IS NULL THEN
    RAISE EXCEPTION 'Tabel dealers/garages ontbreekt. Pas eerst db/migrations/001–005 toe.';
  END IF;
  IF to_regclass('public.vehicles') IS NULL THEN
    RAISE EXCEPTION 'Tabel vehicles ontbreekt. Pas eerst db/migrations/002 toe.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 1. Oude GUC-policies weg (app.dealer_id / app.role / app.public_read)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS vehicles_tenant ON public.vehicles;
DROP POLICY IF EXISTS vehicles_public_read ON public.vehicles;
DROP POLICY IF EXISTS stock_import_batches_tenant ON public.stock_import_batches;
DROP POLICY IF EXISTS stock_import_rows_tenant ON public.stock_import_rows;
DROP POLICY IF EXISTS stock_import_batches_tenant ON public.import_jobs;
DROP POLICY IF EXISTS stock_import_rows_tenant ON public.import_job_rows;
DROP POLICY IF EXISTS locations_tenant ON public.locations;
DROP POLICY IF EXISTS bookable_resources_tenant ON public.bookable_resources;
DROP POLICY IF EXISTS location_opening_hours_tenant ON public.location_opening_hours;
DROP POLICY IF EXISTS location_opening_exceptions_tenant ON public.location_opening_exceptions;
DROP POLICY IF EXISTS availability_bookings_tenant ON public.availability_bookings;
DROP POLICY IF EXISTS private_profiles_owner ON public.private_profiles;
DROP POLICY IF EXISTS professional_onboardings_owner ON public.professional_onboardings;
DROP POLICY IF EXISTS garage_claim_requests_owner ON public.garage_claim_requests;

-- ---------------------------------------------------------------------------
-- 2. dealers → garages, dealer_id → garage_id
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.dealers') IS NOT NULL AND to_regclass('public.garages') IS NULL THEN
    ALTER TABLE public.dealers RENAME TO garages;
  END IF;
END $$;

ALTER TABLE public.garages ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.garages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'dealer_id'
      AND table_name IN (
        'vehicles', 'locations', 'bookable_resources',
        'location_opening_hours', 'location_opening_exceptions',
        'availability_bookings', 'stock_import_batches', 'stock_import_rows',
        'import_jobs', 'import_job_rows'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I RENAME COLUMN dealer_id TO garage_id', rec.table_name);
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.stock_import_batches') IS NOT NULL AND to_regclass('public.import_jobs') IS NULL THEN
    ALTER TABLE public.stock_import_batches RENAME TO import_jobs;
  END IF;
  IF to_regclass('public.stock_import_rows') IS NOT NULL AND to_regclass('public.import_job_rows') IS NULL THEN
    ALTER TABLE public.stock_import_rows RENAME TO import_job_rows;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'import_job_rows' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE public.import_job_rows RENAME COLUMN batch_id TO job_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'import_batch_id'
  ) THEN
    ALTER TABLE public.vehicles RENAME COLUMN import_batch_id TO import_job_id;
  END IF;
END $$;

ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS applied_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS invalid_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS finished_at timestamptz;
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS doors smallint;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS seats smallint;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS co2_gkm integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS euro_norm text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS equipment jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS warranty_months integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS inspection_valid_until date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS previous_owners integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS description_nl text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS description_fr text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS indicative_price_eur integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS indicative_price_updated_at timestamptz;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS indicative_price_source text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'vat_deductible'
  ) THEN
    ALTER TABLE public.vehicles
      ADD COLUMN vat_deductible boolean
      GENERATED ALWAYS AS (vat_regime = 'btw-aftrekbaar') STORED;
  END IF;
END $$;

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_color_len;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_color_len
  CHECK (color IS NULL OR char_length(btrim(color)) BETWEEN 1 AND 40);
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_doors_range;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_doors_range
  CHECK (doors IS NULL OR doors BETWEEN 2 AND 6);
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_seats_range;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_seats_range
  CHECK (seats IS NULL OR seats BETWEEN 1 AND 9);
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_co2_range;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_co2_range
  CHECK (co2_gkm IS NULL OR co2_gkm BETWEEN 0 AND 999);
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_euro_norm_len;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_euro_norm_len
  CHECK (euro_norm IS NULL OR char_length(btrim(euro_norm)) BETWEEN 1 AND 20);
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_equipment_array;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_equipment_array
  CHECK (jsonb_typeof(equipment) = 'array');
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_warranty_range;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_warranty_range
  CHECK (warranty_months IS NULL OR warranty_months BETWEEN 0 AND 120);
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_previous_owners_range;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_previous_owners_range
  CHECK (previous_owners IS NULL OR previous_owners >= 0);
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_indicative_price;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_indicative_price
  CHECK (indicative_price_eur IS NULL OR indicative_price_eur > 0);

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_publication;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_publication CHECK (
  publication_status IN ('draft', 'published', 'paused', 'sold', 'archived')
);

DROP INDEX IF EXISTS public.vehicles_public_idx;
CREATE INDEX IF NOT EXISTS vehicles_garage_alive_idx
  ON public.vehicles (garage_id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS vehicles_public_live_idx
  ON public.vehicles (publication_status, garage_id)
  WHERE deleted_at IS NULL AND publication_status = 'published' AND fictional = false;
CREATE UNIQUE INDEX IF NOT EXISTS garages_kbo_verified_uidx
  ON public.garages (kbo_number)
  WHERE kbo_number IS NOT NULL AND verification_status = 'verified' AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Nieuwe tabellen
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 80),
  account_kind text NOT NULL DEFAULT 'private' CHECK (account_kind IN ('private', 'professional')),
  locale text NOT NULL DEFAULT 'nl' CHECK (locale IN ('nl', 'fr')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'nl';

CREATE TABLE IF NOT EXISTS public.garage_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT garage_members_unique UNIQUE (garage_id, user_id)
);

CREATE INDEX IF NOT EXISTS garage_members_user_id_idx ON public.garage_members (user_id);
CREATE INDEX IF NOT EXISTS garage_members_garage_id_idx ON public.garage_members (garage_id);

CREATE TABLE IF NOT EXISTS public.vehicle_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_cover boolean NOT NULL DEFAULT false,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer NOT NULL CHECK (byte_size > 0 AND byte_size <= 5242880),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_photos_path_unique UNIQUE (storage_path),
  CONSTRAINT vehicle_photos_path_format CHECK (
    storage_path ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
  )
);

CREATE INDEX IF NOT EXISTS vehicle_photos_vehicle_idx
  ON public.vehicle_photos (vehicle_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_photos_one_cover_idx
  ON public.vehicle_photos (vehicle_id)
  WHERE is_cover;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id)
);

INSERT INTO public.app_settings (key, value)
VALUES ('public_closed', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES public.profiles (id),
  note text
);

CREATE TABLE IF NOT EXISTS public.vehicle_private (
  vehicle_id uuid PRIMARY KEY REFERENCES public.vehicles (id) ON DELETE CASCADE,
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  vin text,
  license_plate text,
  decode_status text NOT NULL DEFAULT 'none'
    CHECK (decode_status IN ('none', 'pending', 'ok', 'failed')),
  decode_source text,
  decoded_at timestamptz,
  decoded_payload jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_private_vin_format CHECK (
    vin IS NULL OR vin ~* '^[A-HJ-NPR-Z0-9]{11,17}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS vehicle_private_garage_vin_uidx
  ON public.vehicle_private (garage_id, vin)
  WHERE vin IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'won', 'lost', 'spam')),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 200),
  phone text,
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 2000),
  locale text NOT NULL DEFAULT 'nl' CHECK (locale IN ('nl', 'fr')),
  source text NOT NULL DEFAULT 'listing',
  consent_at timestamptz NOT NULL,
  assigned_to uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_garage_status_idx
  ON public.leads (garage_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_vehicle_idx
  ON public.leads (vehicle_id);

CREATE TABLE IF NOT EXISTS public.vehicle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages (id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'contact', 'favorite')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicle_events_vehicle_type_idx
  ON public.vehicle_events (vehicle_id, event_type, created_at);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid REFERENCES public.garages (id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles (id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_garage_idx
  ON public.audit_log (garage_id, created_at DESC);

-- Dev-testdata uit de oude custom-auth mag niet naar auth.users wijzen.
UPDATE public.vehicles SET import_job_id = NULL WHERE import_job_id IS NOT NULL;
DELETE FROM public.import_job_rows;
DELETE FROM public.import_jobs;
DELETE FROM public.garage_claim_requests;
DELETE FROM public.professional_onboardings;

ALTER TABLE public.import_jobs DROP CONSTRAINT IF EXISTS stock_import_batches_created_by_fkey;
ALTER TABLE public.import_jobs DROP CONSTRAINT IF EXISTS import_jobs_created_by_fkey;
ALTER TABLE public.import_jobs
  ADD CONSTRAINT import_jobs_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles (id);

ALTER TABLE public.garages DROP CONSTRAINT IF EXISTS dealers_owner_fk;
ALTER TABLE public.garages DROP CONSTRAINT IF EXISTS garages_owner_profile_fk;
UPDATE public.garages
   SET owner_user_id = NULL
 WHERE owner_user_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = owner_user_id);
ALTER TABLE public.garages
  ADD CONSTRAINT garages_owner_profile_fk
  FOREIGN KEY (owner_user_id) REFERENCES public.profiles (id);

ALTER TABLE public.professional_onboardings DROP CONSTRAINT IF EXISTS professional_onboardings_user_id_fkey;
ALTER TABLE public.professional_onboardings
  ADD CONSTRAINT professional_onboardings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE public.garage_claim_requests DROP CONSTRAINT IF EXISTS garage_claim_requests_claimant_user_id_fkey;
ALTER TABLE public.garage_claim_requests
  ADD CONSTRAINT garage_claim_requests_claimant_user_id_fkey
  FOREIGN KEY (claimant_user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 4. Functies (SECURITY DEFINER in private, vaste search_path)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.is_public_closed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    (
      SELECT (s.value = 'true'::jsonb)
      FROM public.app_settings s
      WHERE s.key = 'public_closed'
    ),
    true
  );
$$;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins pa
    WHERE pa.user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION private.is_garage_member(garage_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT garage_id IS NOT NULL AND (
    private.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.garage_members gm
      WHERE gm.garage_id = is_garage_member.garage_id
        AND gm.user_id = (SELECT auth.uid())
    )
  );
$$;

CREATE OR REPLACE FUNCTION private.is_garage_owner(garage_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT garage_id IS NOT NULL AND (
    private.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.garage_members gm
      WHERE gm.garage_id = is_garage_owner.garage_id
        AND gm.user_id = (SELECT auth.uid())
        AND gm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1
      FROM public.garages g
      WHERE g.id = is_garage_owner.garage_id
        AND g.owner_user_id IS NOT DISTINCT FROM (SELECT auth.uid())
    )
  );
$$;

-- Publieke helper, zoals gevraagd: SECURITY DEFINER + vaste search_path.
-- Implementatie staat in private (niet-exposed) om search_path-injectie te beperken.
CREATE OR REPLACE FUNCTION public.is_garage_member(garage_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT private.is_garage_member(garage_id);
$$;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, account_kind)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data ->> 'display_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Gebruiker'
    ),
    'private'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.garages_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NOT private.is_platform_admin() THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Alleen platformbeheer mag verification_status wijzigen';
    END IF;
    IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
      RAISE EXCEPTION 'Alleen platformbeheer mag de eigenaar wijzigen';
    END IF;
    IF NEW.is_public IS DISTINCT FROM OLD.is_public AND NOT private.is_garage_owner(OLD.id) THEN
      RAISE EXCEPTION 'Alleen een owner mag de garage publiceren';
    END IF;
  END IF;
  IF NEW.is_public AND NEW.verification_status IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'Een niet-geverifieerde garage kan niet openbaar zijn';
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     AND NOT private.is_garage_owner(NEW.id) THEN
    RAISE EXCEPTION 'Alleen een owner mag de garage archiveren';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.vehicles_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_status text;
BEGIN
  IF NEW.publication_status = 'published' THEN
    SELECT g.verification_status INTO v_status
    FROM public.garages g
    WHERE g.id = NEW.garage_id;
    IF v_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Een niet-geverifieerde garage kan niet publiceren';
    END IF;
    IF NEW.fictional THEN
      RAISE EXCEPTION 'Fictieve voorraad kan niet publiek staan';
    END IF;
    IF NEW.published_at IS NULL THEN
      NEW.published_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.vehicle_photos_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_garage uuid;
  v_count integer;
  v_expected text;
BEGIN
  SELECT v.garage_id INTO v_garage
  FROM public.vehicles v
  WHERE v.id = NEW.vehicle_id;
  IF v_garage IS NULL THEN
    RAISE EXCEPTION 'Voertuig bestaat niet';
  END IF;
  NEW.garage_id := v_garage;
  v_expected := v_garage::text || '/' || NEW.vehicle_id::text || '/' || split_part(NEW.storage_path, '/', 3);
  IF NEW.storage_path IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION 'storage_path moet {garage_id}/{vehicle_id}/{uuid}.ext zijn';
  END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO v_count
    FROM public.vehicle_photos p
    WHERE p.vehicle_id = NEW.vehicle_id;
    IF v_count >= 20 THEN
      RAISE EXCEPTION 'Maximaal 20 foto''s per auto';
    END IF;
  END IF;
  IF NEW.is_cover THEN
    UPDATE public.vehicle_photos
       SET is_cover = false
     WHERE vehicle_id = NEW.vehicle_id
       AND id IS DISTINCT FROM COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
       AND is_cover;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.garage_members_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role = 'owner' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.garage_members gm
      WHERE gm.garage_id = OLD.garage_id
        AND gm.role = 'owner'
        AND gm.id IS DISTINCT FROM OLD.id
    ) THEN
      RAISE EXCEPTION 'Een garage moet minstens één owner houden';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role IS DISTINCT FROM 'owner' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.garage_members gm
      WHERE gm.garage_id = OLD.garage_id
        AND gm.role = 'owner'
        AND gm.id IS DISTINCT FROM OLD.id
    ) THEN
      RAISE EXCEPTION 'Een garage moet minstens één owner houden';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_row_garage_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_garage uuid;
BEGIN
  SELECT v.garage_id INTO v_garage
  FROM public.vehicles v
  WHERE v.id = NEW.vehicle_id;
  IF NEW.vehicle_id IS NOT NULL AND v_garage IS NULL THEN
    RAISE EXCEPTION 'Voertuig bestaat niet';
  END IF;
  IF v_garage IS NOT NULL THEN
    NEW.garage_id := v_garage;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.storage_folder(object_name text, folder_index integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT (string_to_array(object_name, '/'))[folder_index];
$$;

CREATE OR REPLACE FUNCTION private.safe_uuid(value text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
BEGIN
  IF value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN value::uuid;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.storage_object_allowed(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vehicles v
    WHERE v.id = private.safe_uuid(private.storage_folder(object_name, 2))
      AND v.garage_id = private.safe_uuid(private.storage_folder(object_name, 1))
      AND v.deleted_at IS NULL
      AND private.is_garage_member(v.garage_id)
  );
$$;

CREATE OR REPLACE FUNCTION private.vehicle_is_public(p_vehicle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vehicles v
    JOIN public.garages g ON g.id = v.garage_id
    WHERE v.id = p_vehicle_id
      AND v.deleted_at IS NULL
      AND v.publication_status = 'published'
      AND v.fictional = false
      AND NOT private.is_public_closed()
      AND g.is_public
      AND g.verification_status = 'verified'
      AND g.deleted_at IS NULL
  );
$$;

-- ---------------------------------------------------------------------------
-- 5. Triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS garages_set_updated_at ON public.garages;
CREATE TRIGGER garages_set_updated_at
  BEFORE UPDATE ON public.garages
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS garages_guard ON public.garages;
CREATE TRIGGER garages_guard
  BEFORE INSERT OR UPDATE ON public.garages
  FOR EACH ROW EXECUTE FUNCTION private.garages_guard();

DROP TRIGGER IF EXISTS vehicles_set_updated_at ON public.vehicles;
CREATE TRIGGER vehicles_set_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS vehicles_guard ON public.vehicles;
CREATE TRIGGER vehicles_guard
  BEFORE INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION private.vehicles_guard();

DROP TRIGGER IF EXISTS vehicle_photos_set_updated_at ON public.vehicle_photos;
CREATE TRIGGER vehicle_photos_set_updated_at
  BEFORE UPDATE ON public.vehicle_photos
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS vehicle_photos_guard ON public.vehicle_photos;
CREATE TRIGGER vehicle_photos_guard
  BEFORE INSERT OR UPDATE ON public.vehicle_photos
  FOR EACH ROW EXECUTE FUNCTION private.vehicle_photos_guard();

DROP TRIGGER IF EXISTS garage_members_guard ON public.garage_members;
CREATE TRIGGER garage_members_guard
  BEFORE UPDATE OR DELETE ON public.garage_members
  FOR EACH ROW EXECUTE FUNCTION private.garage_members_guard();

DROP TRIGGER IF EXISTS app_settings_set_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_set_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS vehicle_private_set_updated_at ON public.vehicle_private;
CREATE TRIGGER vehicle_private_set_updated_at
  BEFORE UPDATE ON public.vehicle_private
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS vehicle_private_sync_garage ON public.vehicle_private;
CREATE TRIGGER vehicle_private_sync_garage
  BEFORE INSERT OR UPDATE ON public.vehicle_private
  FOR EACH ROW EXECUTE FUNCTION private.sync_row_garage_id();

DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;
CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS leads_sync_garage ON public.leads;
CREATE TRIGGER leads_sync_garage
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION private.sync_row_garage_id();

DROP TRIGGER IF EXISTS vehicle_events_sync_garage ON public.vehicle_events;
CREATE TRIGGER vehicle_events_sync_garage
  BEFORE INSERT OR UPDATE ON public.vehicle_events
  FOR EACH ROW EXECUTE FUNCTION private.sync_row_garage_id();

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.garage_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.import_job_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_job_rows FORCE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_private FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE public.professional_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_onboardings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.garage_claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_claim_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookable_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookable_resources FORCE ROW LEVEL SECURITY;
ALTER TABLE public.location_opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_opening_hours FORCE ROW LEVEL SECURITY;
ALTER TABLE public.location_opening_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_opening_exceptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.availability_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_bookings FORCE ROW LEVEL SECURITY;

-- Legacy custom-auth: geen toegang via PostgREST.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.password_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_credentials FORCE ROW LEVEL SECURITY;
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE public.local_mail_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_mail_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits FORCE ROW LEVEL SECURITY;
ALTER TABLE public.private_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR private.is_platform_admin());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR private.is_platform_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR private.is_platform_admin());

DROP POLICY IF EXISTS garages_select_member ON public.garages;
CREATE POLICY garages_select_member ON public.garages
  FOR SELECT TO authenticated
  USING (
    private.is_garage_member(id)
    OR owner_user_id IS NOT DISTINCT FROM (SELECT auth.uid())
  );

DROP POLICY IF EXISTS garages_select_public ON public.garages;
CREATE POLICY garages_select_public ON public.garages
  FOR SELECT TO anon, authenticated
  USING (
    NOT private.is_public_closed()
    AND is_public
    AND verification_status = 'verified'
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS garages_insert_own ON public.garages;
CREATE POLICY garages_insert_own ON public.garages
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_user_id = (SELECT auth.uid())
    AND verification_status = 'unverified'
    AND is_public = false
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS garages_update_member ON public.garages;
CREATE POLICY garages_update_member ON public.garages
  FOR UPDATE TO authenticated
  USING (private.is_garage_member(id))
  WITH CHECK (private.is_garage_member(id));

DROP POLICY IF EXISTS garage_members_select ON public.garage_members;
CREATE POLICY garage_members_select ON public.garage_members
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.is_garage_member(garage_id));

DROP POLICY IF EXISTS garage_members_insert ON public.garage_members;
CREATE POLICY garage_members_insert ON public.garage_members
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_garage_owner(garage_id)
    AND (
      (user_id = (SELECT auth.uid()) AND role = 'owner')
      OR role IN ('owner', 'staff')
    )
  );

DROP POLICY IF EXISTS garage_members_update ON public.garage_members;
CREATE POLICY garage_members_update ON public.garage_members
  FOR UPDATE TO authenticated
  USING (private.is_garage_owner(garage_id))
  WITH CHECK (private.is_garage_owner(garage_id));

DROP POLICY IF EXISTS garage_members_delete ON public.garage_members;
CREATE POLICY garage_members_delete ON public.garage_members
  FOR DELETE TO authenticated
  USING (private.is_garage_owner(garage_id));

DROP POLICY IF EXISTS vehicles_select_member ON public.vehicles;
CREATE POLICY vehicles_select_member ON public.vehicles
  FOR SELECT TO authenticated
  USING (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS vehicles_select_public ON public.vehicles;
CREATE POLICY vehicles_select_public ON public.vehicles
  FOR SELECT TO anon, authenticated
  USING (private.vehicle_is_public(id));

DROP POLICY IF EXISTS vehicles_insert_member ON public.vehicles;
CREATE POLICY vehicles_insert_member ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_garage_member(garage_id)
    AND deleted_at IS NULL
    AND (fictional = false OR private.is_platform_admin())
  );

DROP POLICY IF EXISTS vehicles_update_member ON public.vehicles;
CREATE POLICY vehicles_update_member ON public.vehicles
  FOR UPDATE TO authenticated
  USING (private.is_garage_member(garage_id))
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS vehicle_photos_select_member ON public.vehicle_photos;
CREATE POLICY vehicle_photos_select_member ON public.vehicle_photos
  FOR SELECT TO authenticated
  USING (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS vehicle_photos_select_public ON public.vehicle_photos;
CREATE POLICY vehicle_photos_select_public ON public.vehicle_photos
  FOR SELECT TO anon, authenticated
  USING (private.vehicle_is_public(vehicle_id));

DROP POLICY IF EXISTS vehicle_photos_insert_member ON public.vehicle_photos;
CREATE POLICY vehicle_photos_insert_member ON public.vehicle_photos
  FOR INSERT TO authenticated
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS vehicle_photos_update_member ON public.vehicle_photos;
CREATE POLICY vehicle_photos_update_member ON public.vehicle_photos
  FOR UPDATE TO authenticated
  USING (private.is_garage_member(garage_id))
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS vehicle_photos_delete_member ON public.vehicle_photos;
CREATE POLICY vehicle_photos_delete_member ON public.vehicle_photos
  FOR DELETE TO authenticated
  USING (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS import_jobs_select ON public.import_jobs;
CREATE POLICY import_jobs_select ON public.import_jobs
  FOR SELECT TO authenticated
  USING (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS import_jobs_insert ON public.import_jobs;
CREATE POLICY import_jobs_insert ON public.import_jobs
  FOR INSERT TO authenticated
  WITH CHECK (private.is_garage_owner(garage_id) AND created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS import_jobs_update ON public.import_jobs;
CREATE POLICY import_jobs_update ON public.import_jobs
  FOR UPDATE TO authenticated
  USING (private.is_garage_owner(garage_id))
  WITH CHECK (private.is_garage_owner(garage_id));

DROP POLICY IF EXISTS import_job_rows_select ON public.import_job_rows;
CREATE POLICY import_job_rows_select ON public.import_job_rows
  FOR SELECT TO authenticated
  USING (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS import_job_rows_insert ON public.import_job_rows;
CREATE POLICY import_job_rows_insert ON public.import_job_rows
  FOR INSERT TO authenticated
  WITH CHECK (private.is_garage_owner(garage_id));

DROP POLICY IF EXISTS import_job_rows_update ON public.import_job_rows;
CREATE POLICY import_job_rows_update ON public.import_job_rows
  FOR UPDATE TO authenticated
  USING (private.is_garage_owner(garage_id))
  WITH CHECK (private.is_garage_owner(garage_id));

DROP POLICY IF EXISTS app_settings_select_public ON public.app_settings;
CREATE POLICY app_settings_select_public ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (key = 'public_closed');

DROP POLICY IF EXISTS app_settings_admin_write ON public.app_settings;
CREATE POLICY app_settings_admin_write ON public.app_settings
  FOR ALL TO authenticated
  USING (private.is_platform_admin())
  WITH CHECK (private.is_platform_admin());

DROP POLICY IF EXISTS professional_onboardings_own ON public.professional_onboardings;
CREATE POLICY professional_onboardings_own ON public.professional_onboardings
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.is_platform_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR private.is_platform_admin());

DROP POLICY IF EXISTS garage_claim_requests_own ON public.garage_claim_requests;
CREATE POLICY garage_claim_requests_own ON public.garage_claim_requests
  FOR ALL TO authenticated
  USING (claimant_user_id = (SELECT auth.uid()) OR private.is_platform_admin())
  WITH CHECK (claimant_user_id = (SELECT auth.uid()) OR private.is_platform_admin());

DROP POLICY IF EXISTS locations_member ON public.locations;
CREATE POLICY locations_member ON public.locations
  FOR ALL TO authenticated
  USING (private.is_garage_member(garage_id))
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS bookable_resources_member ON public.bookable_resources;
CREATE POLICY bookable_resources_member ON public.bookable_resources
  FOR ALL TO authenticated
  USING (private.is_garage_member(garage_id))
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS location_opening_hours_member ON public.location_opening_hours;
CREATE POLICY location_opening_hours_member ON public.location_opening_hours
  FOR ALL TO authenticated
  USING (private.is_garage_member(garage_id))
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS location_opening_exceptions_member ON public.location_opening_exceptions;
CREATE POLICY location_opening_exceptions_member ON public.location_opening_exceptions
  FOR ALL TO authenticated
  USING (private.is_garage_member(garage_id))
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS availability_bookings_member ON public.availability_bookings;
CREATE POLICY availability_bookings_member ON public.availability_bookings
  FOR ALL TO authenticated
  USING (private.is_garage_member(garage_id))
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS platform_admins_select ON public.platform_admins;
CREATE POLICY platform_admins_select ON public.platform_admins
  FOR SELECT TO authenticated
  USING (private.is_platform_admin());

DROP POLICY IF EXISTS platform_admins_write ON public.platform_admins;
CREATE POLICY platform_admins_write ON public.platform_admins
  FOR ALL TO authenticated
  USING (private.is_platform_admin())
  WITH CHECK (private.is_platform_admin());

DROP POLICY IF EXISTS vehicle_private_member ON public.vehicle_private;
CREATE POLICY vehicle_private_member ON public.vehicle_private
  FOR ALL TO authenticated
  USING (private.is_garage_member(garage_id))
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS leads_select_member ON public.leads;
CREATE POLICY leads_select_member ON public.leads
  FOR SELECT TO authenticated
  USING (private.is_garage_member(garage_id) OR private.is_platform_admin());

DROP POLICY IF EXISTS leads_insert_public ON public.leads;
CREATE POLICY leads_insert_public ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    consent_at IS NOT NULL
    AND vehicle_id IS NOT NULL
    AND private.vehicle_is_public(vehicle_id)
  );

DROP POLICY IF EXISTS leads_insert_member ON public.leads;
CREATE POLICY leads_insert_member ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    consent_at IS NOT NULL
    AND private.is_garage_member(garage_id)
  );

DROP POLICY IF EXISTS leads_update_member ON public.leads;
CREATE POLICY leads_update_member ON public.leads
  FOR UPDATE TO authenticated
  USING (private.is_garage_member(garage_id))
  WITH CHECK (private.is_garage_member(garage_id));

DROP POLICY IF EXISTS vehicle_events_select_member ON public.vehicle_events;
CREATE POLICY vehicle_events_select_member ON public.vehicle_events
  FOR SELECT TO authenticated
  USING (private.is_garage_member(garage_id) OR private.is_platform_admin());

DROP POLICY IF EXISTS vehicle_events_insert_public ON public.vehicle_events;
CREATE POLICY vehicle_events_insert_public ON public.vehicle_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    event_type IN ('view', 'favorite', 'contact')
    AND private.vehicle_is_public(vehicle_id)
  );

DROP POLICY IF EXISTS vehicle_events_insert_member ON public.vehicle_events;
CREATE POLICY vehicle_events_insert_member ON public.vehicle_events
  FOR INSERT TO authenticated
  WITH CHECK (
    event_type IN ('view', 'favorite', 'contact')
    AND private.is_garage_member(garage_id)
  );

DROP POLICY IF EXISTS audit_log_select_member ON public.audit_log;
CREATE POLICY audit_log_select_member ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    private.is_platform_admin()
    OR (garage_id IS NOT NULL AND private.is_garage_member(garage_id))
  );

DROP POLICY IF EXISTS audit_log_insert_member ON public.audit_log;
CREATE POLICY audit_log_insert_member ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND (
      private.is_platform_admin()
      OR (garage_id IS NOT NULL AND private.is_garage_member(garage_id))
    )
  );

-- ---------------------------------------------------------------------------
-- 7. Storage: private bucket vehicle-photos
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE EXCEPTION 'storage.buckets/objects ontbreekt. Pas toe op Supabase of laad de teststubs.';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-photos',
  'vehicle-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vehicle_photos_storage_select ON storage.objects;
CREATE POLICY vehicle_photos_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-photos' AND private.storage_object_allowed(name));

DROP POLICY IF EXISTS vehicle_photos_storage_insert ON storage.objects;
CREATE POLICY vehicle_photos_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-photos' AND private.storage_object_allowed(name));

DROP POLICY IF EXISTS vehicle_photos_storage_update ON storage.objects;
CREATE POLICY vehicle_photos_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-photos' AND private.storage_object_allowed(name))
  WITH CHECK (bucket_id = 'vehicle-photos' AND private.storage_object_allowed(name));

DROP POLICY IF EXISTS vehicle_photos_storage_delete ON storage.objects;
CREATE POLICY vehicle_photos_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-photos' AND private.storage_object_allowed(name));

-- ---------------------------------------------------------------------------
-- 8. Grants
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;

REVOKE ALL ON FUNCTION private.is_public_closed() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_platform_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_garage_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_garage_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_garage_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.vehicle_is_public(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.storage_object_allowed(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.is_public_closed() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_garage_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_garage_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_garage_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.vehicle_is_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.storage_object_allowed(text) TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.garages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.garages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.garage_members TO authenticated;
GRANT SELECT ON public.vehicles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicle_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vehicle_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.import_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.import_job_rows TO authenticated;
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.platform_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_private TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT ON public.vehicle_events TO authenticated;
GRANT INSERT ON public.vehicle_events TO anon;
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_onboardings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.garage_claim_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookable_resources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_opening_hours TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_opening_exceptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_bookings TO authenticated;

REVOKE ALL ON public.users FROM anon, authenticated;
REVOKE ALL ON public.sessions FROM anon, authenticated;
REVOKE ALL ON public.password_credentials FROM anon, authenticated;
REVOKE ALL ON public.auth_tokens FROM anon, authenticated;
REVOKE ALL ON public.local_mail_messages FROM anon, authenticated;
REVOKE ALL ON public.auth_rate_limits FROM anon, authenticated;
REVOKE ALL ON public.private_profiles FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;

COMMENT ON TABLE public.profiles IS 'Dealer-/gebruikersprofiel, 1-op-1 met auth.users.';
COMMENT ON TABLE public.garages IS 'Voorheen public.dealers (PR #2/#4).';
COMMENT ON TABLE public.garage_members IS 'owner/staff; vervangt users.dealer_id + dealer_admin/dealer_staff.';
COMMENT ON TABLE public.import_jobs IS 'Voorheen stock_import_batches.';
COMMENT ON TABLE public.import_job_rows IS 'Voorheen stock_import_rows.';
COMMENT ON FUNCTION public.is_garage_member(uuid) IS 'SECURITY DEFINER helper voor RLS; search_path vastgezet.';
COMMENT ON FUNCTION private.is_platform_admin() IS 'Bron van waarheid: public.platform_admins, niet JWT user_metadata.';
COMMENT ON TABLE public.platform_admins IS 'Eerste rij (Mohamed) via service role na signup; geen e-mail in SQL.';
COMMENT ON TABLE public.vehicle_private IS 'VIN en kenteken: nooit publiek leesbaar.';
COMMENT ON TABLE public.leads IS 'Aanvragen per auto; inbox MVP-datamodel, UI deels v1.1.';
COMMENT ON TABLE public.vehicle_events IS 'Goedkope event-log zonder PII (geen IP).';
COMMENT ON TABLE public.audit_log IS 'Append-only wie wat wijzigde in een garage.';

