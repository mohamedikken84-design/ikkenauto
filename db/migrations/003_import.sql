CREATE TABLE stock_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers (id),
  source_system text NOT NULL,
  status text NOT NULL,
  created_by uuid NOT NULL REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_import_batches_status CHECK (status IN ('applied', 'rejected', 'rolled_back'))
);

CREATE TABLE stock_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES stock_import_batches (id),
  dealer_id uuid NOT NULL REFERENCES dealers (id),
  line_number integer NOT NULL,
  source_stock_id text,
  status text NOT NULL,
  errors text NOT NULL DEFAULT '',
  CONSTRAINT stock_import_rows_status CHECK (status IN ('applied', 'invalid', 'skipped'))
);

CREATE INDEX stock_import_rows_batch_idx ON stock_import_rows (batch_id);

ALTER TABLE stock_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_import_batches FORCE ROW LEVEL SECURITY;
ALTER TABLE stock_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_import_rows FORCE ROW LEVEL SECURITY;

CREATE POLICY stock_import_batches_tenant ON stock_import_batches
  FOR ALL
  USING (app_is_platform_admin() OR dealer_id = app_dealer_id())
  WITH CHECK (app_is_platform_admin() OR dealer_id = app_dealer_id());

CREATE POLICY stock_import_rows_tenant ON stock_import_rows
  FOR ALL
  USING (app_is_platform_admin() OR dealer_id = app_dealer_id())
  WITH CHECK (app_is_platform_admin() OR dealer_id = app_dealer_id());

ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_import_batch_fk
  FOREIGN KEY (import_batch_id) REFERENCES stock_import_batches (id);
