import { randomBytes, timingSafeEqual } from "node:crypto";
import { withTransaction } from "@/lib/db/client";
import { assertPasswordAuthAllowed, hashSessionToken, insertSession } from "@/lib/dealer/auth";
import { assertMailAllowed, sendAuthMail } from "@/lib/dealer/mail";
import { hashPassword, verifyPassword } from "@/lib/dealer/password";
import { assertRateLimit } from "@/lib/dealer/rate-limit";
import type { Actor } from "@/lib/dealer/types";

export class AccountInputError extends Error {}

const genericRegister = "Als dit adres nog vrij is, staat het verificatiebericht in de lokale testpost.";
const genericLogin = "Onjuiste gegevens, of het adres is nog niet geverifieerd.";
const genericRecovery = "Als er een geverifieerd account bij dit adres hoort, staat het herstelbericht in de lokale testpost.";

export type RegistrationInput = {
  kind: string;
  displayName: string;
  email: string;
  password: string;
  tradeName?: string;
  kboNumber?: string;
  vatNumber?: string;
  postalCode?: string;
  city?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

function validPassword(password: string) {
  return password.length >= 12 && password.length <= 200;
}

function validKbo(value: string) {
  return /^\d{10}$/.test(value.replace(/[\s.]/g, ""));
}

function validVat(value: string) {
  return /^BE[01]\d{9}$/.test(value.replace(/[\s.]/g, "").toUpperCase());
}

function appOrigin() {
  const origin = process.env.APP_ORIGIN?.trim() ?? "";
  if (!origin) throw new AccountInputError("APP_ORIGIN ontbreekt.");
  return origin.replace(/\/$/, "");
}

async function issueToken(userId: string, purpose: "verify_email" | "reset_password", hours: number) {
  const token = randomBytes(32).toString("base64url");
  await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false, userId }, async (client) => {
    await client.query(
      `INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at)
       VALUES ($1, $2, $3, now() + ($4 || ' hours')::interval)`,
      [userId, purpose, hashSessionToken(token), String(hours)],
    );
  });
  return token;
}

export async function registerAccount(input: RegistrationInput, clientKey: string) {
  assertMailAllowed();
  await assertRateLimit("register", clientKey);
  const email = normalizeEmail(input.email);
  const kind = input.kind;
  if (kind !== "particulier" && kind !== "professioneel") {
    throw new AccountInputError("Kies particulier of professioneel.");
  }
  if (!input.displayName.trim() || input.displayName.trim().length > 80) {
    throw new AccountInputError("Vul een naam in van hoogstens 80 tekens.");
  }
  if (!validEmail(email) || !validPassword(input.password)) {
    throw new AccountInputError("Gebruik een geldig e-mailadres en een wachtwoord van minstens 12 tekens.");
  }
  let garage: { tradeName: string; kbo: string; vat: string; postalCode: string; city: string } | null = null;
  if (kind === "professioneel") {
    const kbo = (input.kboNumber ?? "").replace(/[\s.]/g, "");
    const vat = (input.vatNumber ?? "").replace(/[\s.]/g, "").toUpperCase();
    if (!input.tradeName?.trim() || !validKbo(kbo) || !validVat(vat) || !/^\d{4}$/.test(input.postalCode ?? "") || !input.city?.trim()) {
      throw new AccountInputError("Vul handelsnaam, KBO van 10 cijfers, BTW-nummer, postcode en plaats in.");
    }
    garage = {
      tradeName: input.tradeName.trim(),
      kbo,
      vat,
      postalCode: input.postalCode ?? "",
      city: input.city.trim(),
    };
  }

  const existing = await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, (client) =>
    client.query<{ id: string; email_verified_at: string | null }>(
      "SELECT id, email_verified_at FROM users WHERE email = $1",
      [email],
    ),
  );
  if (existing.rows[0]) return { message: genericRegister };

  const passwordHash = await hashPassword(input.password);
  const userId = await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, async (client) => {
    const user = await client.query<{ id: string }>(
      `INSERT INTO users (role, email, display_name) VALUES ('private_user', $1, $2) RETURNING id`,
      [email, input.displayName.trim()],
    );
    const id = user.rows[0].id;
    await client.query("INSERT INTO password_credentials (user_id, password_hash) VALUES ($1, $2)", [id, passwordHash]);
    await client.query("INSERT INTO private_profiles (user_id, display_name) VALUES ($1, $2)", [id, input.displayName.trim()]);
    if (garage) {
      await client.query(
        `INSERT INTO professional_onboardings (user_id, trade_name, kbo_number, vat_number, postal_code, city)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, garage.tradeName, garage.kbo, garage.vat, garage.postalCode, garage.city],
      );
    }
    return id;
  });
  const token = await issueToken(userId, "verify_email", 24);
  await sendAuthMail({
    recipientEmail: email,
    subject: "Bevestig je IKKENAUTO-account",
    body: `${appOrigin()}/account/verifieer?token=${token}`,
  });
  return { message: genericRegister };
}

export async function verifyEmailToken(token: string) {
  assertPasswordAuthAllowed();
  const tokenHash = hashSessionToken(token);
  return withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, async (client) => {
    const found = await client.query<{ id: string; user_id: string }>(
      `UPDATE auth_tokens SET used_at = now()
       WHERE token_hash = $1 AND purpose = 'verify_email' AND used_at IS NULL AND expires_at > now()
       RETURNING id, user_id`,
      [tokenHash],
    );
    const row = found.rows[0];
    if (!row) return false;
    await client.query("UPDATE users SET email_verified_at = now() WHERE id = $1 AND email_verified_at IS NULL", [row.user_id]);
    const onboarding = await client.query<{
      trade_name: string;
      kbo_number: string;
      vat_number: string;
      postal_code: string;
      city: string;
    }>("SELECT trade_name, kbo_number, vat_number, postal_code, city FROM professional_onboardings WHERE user_id = $1", [
      row.user_id,
    ]);
    const garage = onboarding.rows[0];
    if (garage) {
      const email = await client.query<{ email: string }>("SELECT email FROM users WHERE id = $1", [row.user_id]);
      const dealer = await client.query<{ id: string }>(
        `INSERT INTO dealers (
           name, trade_name, owner_user_id, verification_status, is_public, kbo_number, vat_number,
           contact_email, postal_code, city
         ) VALUES ($1, $1, $2, 'unverified', false, $3, $4, $5, $6, $7) RETURNING id`,
        [garage.trade_name, row.user_id, garage.kbo_number, garage.vat_number, email.rows[0].email, garage.postal_code, garage.city],
      );
      await client.query("UPDATE users SET role = 'dealer_admin', dealer_id = $2 WHERE id = $1 AND role = 'private_user'", [
        row.user_id,
        dealer.rows[0].id,
      ]);
    }
    return true;
  });
}

let dummyHash: string | null = null;

async function dummyPasswordHash() {
  dummyHash ??= await hashPassword("niet-een-echt-wachtwoord-voor-timing");
  return dummyHash;
}

export async function loginAccount(email: string, password: string, clientKey: string) {
  assertPasswordAuthAllowed();
  await assertRateLimit("login", clientKey);
  await assertRateLimit("login-email", normalizeEmail(email));
  const normalized = normalizeEmail(email);
  const found = await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, (client) =>
    client.query<{ id: string; password_hash: string; email_verified_at: string | null }>(
      `SELECT u.id, c.password_hash, u.email_verified_at
       FROM users u
       JOIN password_credentials c ON c.user_id = u.id
       WHERE u.email = $1`,
      [normalized],
    ),
  );
  const row = found.rows[0];
  const passwordOk = await verifyPassword(row?.password_hash ?? (await dummyPasswordHash()), password);
  if (!row || !row.email_verified_at || !passwordOk) {
    throw new AccountInputError(genericLogin);
  }
  const token = await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, (client) =>
    insertSession(client, row.id),
  );
  return { token };
}

export async function logoutAccount(token: string) {
  if (!token) return;
  await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, (client) =>
    client.query("UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL", [
      hashSessionToken(token),
    ]),
  );
}

export async function requestPasswordReset(email: string, clientKey: string) {
  assertMailAllowed();
  await assertRateLimit("recovery", clientKey);
  const normalized = normalizeEmail(email);
  const found = await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, (client) =>
    client.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 AND email_verified_at IS NOT NULL",
      [normalized],
    ),
  );
  const user = found.rows[0];
  if (!user) return { message: genericRecovery };
  const token = await issueReset(user.id);
  await sendAuthMail({
    recipientEmail: normalized,
    subject: "Herstel je IKKENAUTO-wachtwoord",
    body: `${appOrigin()}/account/herstel/bevestigen?token=${token}`,
  });
  return { message: genericRecovery };
}

async function issueReset(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, (client) =>
    client.query(
      `INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at)
       VALUES ($1, 'reset_password', $2, now() + interval '1 hour')`,
      [userId, hashSessionToken(token)],
    ),
  );
  return token;
}

export async function confirmPasswordReset(token: string, password: string) {
  assertPasswordAuthAllowed();
  if (!validPassword(password)) throw new AccountInputError("Het nieuwe wachtwoord moet minstens 12 tekens zijn.");
  const tokenHash = hashSessionToken(token);
  const passwordHash = await hashPassword(password);
  const updated = await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, async (client) => {
    const found = await client.query<{ user_id: string }>(
      `UPDATE auth_tokens SET used_at = now()
       WHERE token_hash = $1 AND purpose = 'reset_password' AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [tokenHash],
    );
    const userId = found.rows[0]?.user_id;
    if (!userId) return false;
    await client.query("UPDATE password_credentials SET password_hash = $2, updated_at = now() WHERE user_id = $1", [
      userId,
      passwordHash,
    ]);
    await client.query("UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [userId]);
    return true;
  });
  if (!updated) throw new AccountInputError("Deze herstellink is ongeldig of al gebruikt.");
}

export async function createGarageClaim(actor: Actor, kboNumber: string, evidence: string) {
  const kbo = kboNumber.replace(/[\s.]/g, "");
  if (!validKbo(kbo) || evidence.trim().length < 20) {
    throw new AccountInputError("Vul een KBO van 10 cijfers en een toelichting van minstens 20 tekens in.");
  }
  await withTransaction(
    { dealerId: actor.dealerId, role: actor.role, publicRead: false, userId: actor.userId },
    (client) =>
      client.query(
        `INSERT INTO garage_claim_requests (claimant_user_id, claimed_kbo, evidence)
         VALUES ($1, $2, $3)`,
        [actor.userId, kbo, evidence.trim()],
      ),
  );
}

export async function readOwnProfile(actor: Actor) {
  return withTransaction(
    { dealerId: actor.dealerId, role: actor.role, publicRead: false, userId: actor.userId },
    async (client) => {
      const profile = await client.query<{ display_name: string }>(
        "SELECT display_name FROM private_profiles WHERE user_id = $1",
        [actor.userId],
      );
      const garage = await client.query<{
        trade_name: string | null;
        verification_status: string;
        is_public: boolean;
        kbo_number: string | null;
        city: string | null;
      }>(
        `SELECT trade_name, verification_status, is_public, kbo_number, city
         FROM dealers WHERE id = $1`,
        [actor.dealerId],
      );
      return {
        email: actor.email,
        role: actor.role,
        displayName: profile.rows[0]?.display_name ?? "",
        garage: garage.rows[0] ?? null,
      };
    },
  );
}

export function tokensMatch(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
