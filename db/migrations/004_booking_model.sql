-- Datamodel voor latere reserveringen. Er is geen HTTP-endpoint dat een afspraak maakt.

CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers (id),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Brussels',
  CONSTRAINT locations_timezone CHECK (timezone = 'Europe/Brussels')
);

CREATE TABLE bookable_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers (id),
  location_id uuid NOT NULL REFERENCES locations (id),
  kind text NOT NULL,
  display_name text NOT NULL,
  CONSTRAINT bookable_resources_kind CHECK (kind IN ('staff', 'resource'))
);

CREATE TABLE location_opening_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers (id),
  location_id uuid NOT NULL REFERENCES locations (id),
  weekday smallint NOT NULL,
  opens time NOT NULL,
  closes time NOT NULL,
  CONSTRAINT location_opening_hours_weekday CHECK (weekday BETWEEN 1 AND 7),
  CONSTRAINT location_opening_hours_span CHECK (closes > opens)
);

CREATE TABLE location_opening_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers (id),
  location_id uuid NOT NULL REFERENCES locations (id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  closed boolean NOT NULL,
  CONSTRAINT location_opening_exceptions_span CHECK (ends_at > starts_at)
);

CREATE TABLE availability_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers (id),
  location_id uuid NOT NULL REFERENCES locations (id),
  resource_id uuid NOT NULL REFERENCES bookable_resources (id),
  vehicle_id uuid REFERENCES vehicles (id),
  status text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  buffer_before interval NOT NULL DEFAULT interval '0 minutes',
  buffer_after interval NOT NULL DEFAULT interval '0 minutes',
  duration_minutes integer NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Brussels',
  event_ref text,
  occupied tstzrange NOT NULL,
  CONSTRAINT availability_bookings_status CHECK (status IN ('held', 'confirmed', 'cancelled', 'completed')),
  CONSTRAINT availability_bookings_span CHECK (ends_at > starts_at),
  CONSTRAINT availability_bookings_duration CHECK (duration_minutes > 0),
  CONSTRAINT availability_bookings_timezone CHECK (timezone = 'Europe/Brussels'),
  CONSTRAINT availability_bookings_duration_matches CHECK (
    ends_at = starts_at + make_interval(mins => duration_minutes)
  )
);

CREATE FUNCTION availability_bookings_set_occupied() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.occupied := tstzrange(NEW.starts_at - NEW.buffer_before, NEW.ends_at + NEW.buffer_after, '[)');
  RETURN NEW;
END;
$$;

CREATE TRIGGER availability_bookings_occupy
  BEFORE INSERT OR UPDATE ON availability_bookings
  FOR EACH ROW EXECUTE FUNCTION availability_bookings_set_occupied();

ALTER TABLE availability_bookings
  ADD CONSTRAINT availability_bookings_no_overlap
  EXCLUDE USING gist (
    resource_id WITH =,
    occupied WITH &&
  )
  WHERE (status IN ('held', 'confirmed'));

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations FORCE ROW LEVEL SECURITY;
ALTER TABLE bookable_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookable_resources FORCE ROW LEVEL SECURITY;
ALTER TABLE location_opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_opening_hours FORCE ROW LEVEL SECURITY;
ALTER TABLE location_opening_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_opening_exceptions FORCE ROW LEVEL SECURITY;
ALTER TABLE availability_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_bookings FORCE ROW LEVEL SECURITY;

CREATE POLICY locations_tenant ON locations
  FOR ALL USING (app_is_platform_admin() OR dealer_id = app_dealer_id())
  WITH CHECK (app_is_platform_admin() OR dealer_id = app_dealer_id());

CREATE POLICY bookable_resources_tenant ON bookable_resources
  FOR ALL USING (app_is_platform_admin() OR dealer_id = app_dealer_id())
  WITH CHECK (app_is_platform_admin() OR dealer_id = app_dealer_id());

CREATE POLICY location_opening_hours_tenant ON location_opening_hours
  FOR ALL USING (app_is_platform_admin() OR dealer_id = app_dealer_id())
  WITH CHECK (app_is_platform_admin() OR dealer_id = app_dealer_id());

CREATE POLICY location_opening_exceptions_tenant ON location_opening_exceptions
  FOR ALL USING (app_is_platform_admin() OR dealer_id = app_dealer_id())
  WITH CHECK (app_is_platform_admin() OR dealer_id = app_dealer_id());

CREATE POLICY availability_bookings_tenant ON availability_bookings
  FOR ALL USING (app_is_platform_admin() OR dealer_id = app_dealer_id())
  WITH CHECK (app_is_platform_admin() OR dealer_id = app_dealer_id());
