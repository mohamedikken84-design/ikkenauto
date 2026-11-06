CREATE OR REPLACE FUNCTION app_dealer_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.dealer_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.role', true) = 'platform_admin'
$$;

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers (id),
  source_system text NOT NULL,
  source_stock_id text NOT NULL,
  fictional boolean NOT NULL DEFAULT false,
  provenance text NOT NULL,
  source_rights text NOT NULL,
  publication_status text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  version text NOT NULL,
  price_eur integer NOT NULL,
  mileage_km integer NOT NULL,
  first_registration text NOT NULL,
  fuel text NOT NULL,
  transmission text NOT NULL,
  body text NOT NULL,
  power_kw integer NOT NULL,
  postal_code text NOT NULL,
  city text NOT NULL,
  lat double precision,
  lng double precision,
  vat_regime text NOT NULL,
  description text NOT NULL,
  import_batch_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_source_unique UNIQUE (dealer_id, source_system, source_stock_id),
  CONSTRAINT vehicles_price CHECK (price_eur > 0),
  CONSTRAINT vehicles_mileage CHECK (mileage_km >= 0),
  CONSTRAINT vehicles_power CHECK (power_kw > 0),
  CONSTRAINT vehicles_publication CHECK (publication_status IN ('draft', 'published', 'paused', 'sold')),
  CONSTRAINT vehicles_rights CHECK (source_rights IN ('dealer-owned', 'imported-by-dealer', 'dev-fictional')),
  CONSTRAINT vehicles_fictional_rights CHECK (
    (fictional = true AND source_rights = 'dev-fictional')
    OR (fictional = false AND source_rights IN ('dealer-owned', 'imported-by-dealer'))
  )
);

CREATE INDEX vehicles_public_idx ON vehicles (publication_status, fictional);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;

CREATE POLICY vehicles_tenant ON vehicles
  FOR ALL
  USING (app_is_platform_admin() OR dealer_id = app_dealer_id())
  WITH CHECK (app_is_platform_admin() OR dealer_id = app_dealer_id());

CREATE POLICY vehicles_public_read ON vehicles
  FOR SELECT
  USING (
    current_setting('app.public_read', true) = 'on'
    AND publication_status = 'published'
    AND fictional = false
  );
