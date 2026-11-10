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
