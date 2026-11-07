-- migrate:no-transaction
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'private_user';

ALTER TABLE users ADD COLUMN email_verified_at timestamptz;
ALTER TABLE users DROP CONSTRAINT users_role_tenant;
ALTER TABLE users ADD CONSTRAINT users_role_tenant CHECK (
  (role IN ('platform_admin', 'private_user') AND dealer_id IS NULL)
  OR (role IN ('dealer_admin', 'dealer_staff') AND dealer_id IS NOT NULL)
);

ALTER TABLE sessions ADD COLUMN revoked_at timestamptz;

ALTER TABLE dealers ADD COLUMN owner_user_id uuid;
ALTER TABLE dealers ADD COLUMN verification_status text NOT NULL DEFAULT 'unverified';
ALTER TABLE dealers ADD COLUMN is_public boolean NOT NULL DEFAULT false;
ALTER TABLE dealers ADD COLUMN trade_name text;
ALTER TABLE dealers ADD COLUMN kbo_number text;
ALTER TABLE dealers ADD COLUMN vat_number text;
ALTER TABLE dealers ADD COLUMN contact_email text;
ALTER TABLE dealers ADD COLUMN postal_code text;
ALTER TABLE dealers ADD COLUMN city text;
ALTER TABLE dealers ADD CONSTRAINT dealers_verification_status CHECK (
  verification_status IN ('unverified', 'pending_review', 'verified')
);
ALTER TABLE dealers ADD CONSTRAINT dealers_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users (id);

CREATE TABLE password_credentials (
  user_id uuid PRIMARY KEY REFERENCES users (id),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE private_profiles (
  user_id uuid PRIMARY KEY REFERENCES users (id),
  display_name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE professional_onboardings (
  user_id uuid PRIMARY KEY REFERENCES users (id),
  trade_name text NOT NULL,
  kbo_number text NOT NULL,
  vat_number text NOT NULL,
  postal_code text NOT NULL,
  city text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  purpose text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  CONSTRAINT auth_tokens_purpose CHECK (purpose IN ('verify_email', 'reset_password'))
);

CREATE TABLE local_mail_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_rate_limits (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL,
  window_start timestamptz NOT NULL
);

CREATE TABLE garage_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_user_id uuid NOT NULL REFERENCES users (id),
  claimed_kbo text NOT NULL,
  evidence text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT garage_claim_requests_status CHECK (status IN ('pending', 'rejected', 'approved'))
);

ALTER TABLE private_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY private_profiles_owner ON private_profiles
  FOR ALL
  USING (app_is_platform_admin() OR user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (app_is_platform_admin() OR user_id = nullif(current_setting('app.user_id', true), '')::uuid);

ALTER TABLE professional_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_onboardings FORCE ROW LEVEL SECURITY;
CREATE POLICY professional_onboardings_owner ON professional_onboardings
  FOR ALL
  USING (app_is_platform_admin() OR user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (app_is_platform_admin() OR user_id = nullif(current_setting('app.user_id', true), '')::uuid);

ALTER TABLE garage_claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_claim_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY garage_claim_requests_owner ON garage_claim_requests
  FOR ALL
  USING (app_is_platform_admin() OR claimant_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (app_is_platform_admin() OR claimant_user_id = nullif(current_setting('app.user_id', true), '')::uuid);
