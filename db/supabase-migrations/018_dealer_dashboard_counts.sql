-- 018: Authenticated dashboard counts in one PostgREST request.
-- SECURITY INVOKER: all underlying RLS policies continue to apply.
-- No user rows or existing table schema are mutated.
CREATE OR REPLACE FUNCTION public.portal_dealer_dashboard_counts()
RETURNS TABLE(total_vehicles bigint,ready_vehicles bigint,sold_vehicles bigint,total_leads bigint)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
 SELECT
  (SELECT count(*) FROM public.portal_vehicles v WHERE v.dealer_id=d.id),
  (SELECT count(*) FROM public.portal_vehicles v WHERE v.dealer_id=d.id AND v.status='ready'),
  (SELECT count(*) FROM public.portal_vehicles v WHERE v.dealer_id=d.id AND v.status='sold'),
  (SELECT count(*) FROM public.portal_leads l WHERE l.dealer_id=d.id)
 FROM public.portal_dealers d
 WHERE d.owner_id=(select auth.uid())
 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.portal_dealer_dashboard_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.portal_dealer_dashboard_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.portal_dealer_dashboard_counts() TO authenticated;
COMMENT ON FUNCTION public.portal_dealer_dashboard_counts() IS
 'Private RLS-respecting per-owner dealer counts, combines four network requests into one.';
