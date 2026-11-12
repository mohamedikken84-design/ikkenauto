-- Ensure one active dealer record per known business number, and one approved
-- ownership claim per directory entry. No existing data is deleted.
create unique index if not exists portal_dealers_unique_kbo
  on public.portal_dealers (kbo_number)
  where kbo_number is not null and kbo_number <> '';

create unique index if not exists portal_directory_one_approved_claim
  on public.portal_directory_claims (source_row)
  where status = 'approved';
