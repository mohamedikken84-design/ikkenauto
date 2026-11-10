-- UX-instellingen die de bijgewerkte architect-spec niet tegenspreken.
-- needs_info/rejected komen er niet bij: de spec houdt drie verificatiestatussen.
-- Een minimumaantal foto's staat in app_settings (standaard 3) en wordt in de app
-- afgedwongen. De database-trigger van de architect blijft de publicatiepoort
-- op verificatie en fictie, zonder fotodrempel.
-- KBO is na aanmaak alleen-lezen, tenzij kbo_editable true is.
-- Verkocht blijft terminaal, tenzij sold_reversible true is.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
INSERT INTO public.app_settings (key, value) VALUES
  ('photo_min_to_publish', '3'::jsonb),
  ('kbo_editable', 'false'::jsonb),
  ('sold_reversible', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.setting_bool(p_key text, p_default boolean)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    (SELECT s.value = 'true'::jsonb FROM public.app_settings s WHERE s.key = p_key),
    p_default
  );
$$;

CREATE OR REPLACE FUNCTION private.setting_int(p_key text, p_default integer)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN jsonb_typeof(s.value) = 'number' THEN (s.value #>> '{}')::integer
        ELSE NULL
      END
      FROM public.app_settings s
      WHERE s.key = p_key
    ),
    p_default
  );
$$;

CREATE OR REPLACE FUNCTION private.profiles_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.account_kind IS DISTINCT FROM OLD.account_kind
     AND current_user IS DISTINCT FROM 'service_role'
     AND NOT private.is_platform_admin() THEN
    RAISE EXCEPTION 'account_kind kan niet zelf gekozen worden';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard ON public.profiles;
CREATE TRIGGER profiles_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.profiles_guard();

CREATE OR REPLACE FUNCTION private.garages_kbo_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.kbo_number IS DISTINCT FROM OLD.kbo_number
     AND current_user IS DISTINCT FROM 'service_role'
     AND NOT private.is_platform_admin()
     AND NOT private.setting_bool('kbo_editable', false) THEN
    RAISE EXCEPTION 'Het ondernemingsnummer kan na registratie niet worden gewijzigd';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS garages_kbo_lock ON public.garages;
CREATE TRIGGER garages_kbo_lock
  BEFORE UPDATE ON public.garages
  FOR EACH ROW EXECUTE FUNCTION private.garages_kbo_lock();
