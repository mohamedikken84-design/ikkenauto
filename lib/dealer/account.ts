import { randomBytes } from "node:crypto";
import { withService, withTransaction } from "@/lib/db/client";
import { actorAccess, assertLocalAuthAllowed, hashSessionToken, insertLocalSession, supabaseConfigured } from "@/lib/dealer/auth";
import { assertMailAllowed, sendAuthMail } from "@/lib/dealer/mail";
import { hashPassword, verifyPassword } from "@/lib/dealer/password";
import { assertRateLimit } from "@/lib/dealer/rate-limit";
import type { Actor } from "@/lib/dealer/types";
import { AccountFieldError, AccountInputError } from "@/lib/dealer/errors";

export { AccountFieldError, AccountInputError };

const genericRegister =
  "Als dit e-mailadres nog vrij is, sturen wij een bevestigingsbericht. Dat kan enkele minuten duren. Kijk ook in uw map Ongewenst.";
const genericLogin = "Onjuiste gegevens, of het adres is nog niet bevestigd.";
const genericRecovery =
  "Als er een bevestigd account bij dit adres hoort, sturen wij een herstelbericht. Dat kan enkele minuten duren. Kijk ook in Ongewenst.";
const genericResend =
  "Als dit adres bij een nog niet bevestigd account hoort, sturen wij een nieuw bericht. Dat kan enkele minuten duren.";

export type RegistrationInput = {
  kind: string;
  displayName: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  acceptTerms?: boolean;
  locale?: string;
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

function localeOf(value: string | undefined) {
  return value === "fr" ? "fr" : "nl";
}

function appOrigin() {
  const origin = process.env.APP_ORIGIN?.trim() ?? "";
  if (!origin) throw new AccountInputError("APP_ORIGIN ontbreekt.");
  return origin.replace(/\/$/, "");
}

async function issueToken(userId: string, purpose: "verify_email" | "reset_password", hours: number) {
  const token = randomBytes(32).toString("base64url");
  await withService((client) =>
    client.query(
      `INSERT INTO auth.local_tokens (user_id, purpose, token_hash, expires_at)
       VALUES ($1, $2, $3, now() + ($4 || ' hours')::interval)`,
      [userId, purpose, hashSessionToken(token), String(hours)],
    ),
  );
  return token;
}

function mailCopy(locale: "nl" | "fr", name: string, link: string, kind: "verify" | "reset") {
  if (kind === "verify" && locale === "fr") {
    return {
      subject: "Confirmez votre compte IKKENAUTO",
      body: `Bonjour ${name},\n\nMerci de votre inscription sur IKKENAUTO, la place de marché automobile belge pour les professionnels.\n\nConfirmez votre adresse e-mail via ce lien (valable 24 heures) :\n${link}\n\nVous pourrez ensuite vous connecter et préparer le stock de votre garage. Le site n'est pas encore ouvert aux acheteurs.\n\nVous n'avez pas demandé ce compte ? Ignorez simplement ce message.\n\nBien cordialement,\nL'équipe IKKENAUTO\nhttps://ikkenauto.be\n`,
    };
  }
  if (kind === "verify") {
    return {
      subject: "Bevestig uw IKKENAUTO-account",
      body: `Dag ${name},\n\nBedankt voor uw registratie bij IKKENAUTO, de Belgische automarktplaats voor dealers.\n\nBevestig uw e-mailadres via deze link (24 uur geldig):\n${link}\n\nDaarna kunt u zich aanmelden en de voorraad van uw garage klaarzetten. De site is nog niet open voor kopers.\n\nHebt u dit account niet aangevraagd? Dan mag u dit bericht negeren.\n\nMet vriendelijke groeten,\nHet team van IKKENAUTO\nhttps://ikkenauto.be\n`,
    };
  }
  if (locale === "fr") {
    return {
      subject: "Définissez un nouveau mot de passe IKKENAUTO",
      body: `Bonjour ${name},\n\nUne demande de nouveau mot de passe a été faite pour votre compte dealer IKKENAUTO.\n\nChoisissez un nouveau mot de passe via ce lien (valable une heure, usage unique) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message. Votre mot de passe actuel reste valable.\n\nBien cordialement,\nL'équipe IKKENAUTO\nhttps://ikkenauto.be\n`,
    };
  }
  return {
    subject: "Stel een nieuw IKKENAUTO-wachtwoord in",
    body: `Dag ${name},\n\nIemand heeft een nieuw wachtwoord aangevraagd voor uw IKKENAUTO-dealeraccount.\n\nKies een nieuw wachtwoord via deze link (één uur geldig, één keer te gebruiken):\n${link}\n\nAls u dit niet hebt gevraagd, mag u dit bericht negeren. Uw huidige wachtwoord blijft dan geldig.\n\nMet vriendelijke groeten,\nHet team van IKKENAUTO\nhttps://ikkenauto.be\n`,
  };
}

export async function registerAccount(input: RegistrationInput, clientKey: string) {
  assertLocalAuthAllowed();
  if (supabaseConfigured()) {
    const remote = await import("@/lib/supabase/auth");
    return remote.registerWithSupabase(input);
  }
  assertMailAllowed();
  await assertRateLimit("register", clientKey);
  const email = normalizeEmail(input.email);
  const kind = input.kind;
  const locale = localeOf(input.locale);
  if (kind !== "particulier" && kind !== "professioneel") {
    throw new AccountInputError("Kies particulier of professioneel.");
  }
  const fields: Record<string, string> = {};
  if (!input.acceptTerms) fields.acceptTerms = "Bevestig dat u de voorwaarden en de privacyverklaring hebt gelezen.";
  if (!input.displayName.trim() || input.displayName.trim().length > 80) fields.displayName = "Vul uw naam in (maximaal 80 tekens).";
  if (!validEmail(email)) fields.email = "Voer een geldig e-mailadres in.";
  if (!validPassword(input.password)) fields.password = "Het wachtwoord moet minstens 12 tekens tellen.";
  if ((input.passwordConfirm ?? "") !== input.password) fields.passwordConfirm = "De wachtwoorden komen niet overeen.";
  appOrigin();
  let garage: { tradeName: string; kbo: string; vat: string; postalCode: string; city: string } | null = null;
  if (kind === "professioneel") {
    const kbo = (input.kboNumber ?? "").replace(/[\s.]/g, "");
    const vat = (input.vatNumber ?? "").replace(/[\s.]/g, "").toUpperCase();
    if (!input.tradeName?.trim() || input.tradeName.trim().length > 120) fields.tradeName = "Vul de handelsnaam van de garage in.";
    if (!validKbo(kbo)) fields.kboNumber = "Voer een KBO-nummer van 10 cijfers in, bijvoorbeeld 0123.456.749.";
    if (!validVat(vat)) fields.vatNumber = "Voer een Belgisch btw-nummer in, bijvoorbeeld BE0123.456.749.";
    if (!/^\d{4}$/.test(input.postalCode ?? "")) fields.postalCode = "De postcode moet uit 4 cijfers bestaan.";
    if (!input.city?.trim()) fields.city = "Vul de gemeente in.";
    if (!fields.tradeName && !fields.kboNumber && !fields.vatNumber && !fields.postalCode && !fields.city) {
      garage = { tradeName: input.tradeName!.trim(), kbo, vat, postalCode: input.postalCode ?? "", city: input.city!.trim() };
    }
  }
  if (Object.keys(fields).length > 0) throw new AccountFieldError(fields);

  const existing = await withService((client) =>
    client.query<{ id: string }>("SELECT id FROM auth.users WHERE email = $1", [email]),
  );
  if (existing.rows[0]) return { message: genericRegister };

  const passwordHash = await hashPassword(input.password);
  const userId = await withService(async (client) => {
    const user = await client.query<{ id: string }>(
      `INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
       VALUES ($1, $2, $3::jsonb) RETURNING id`,
      [email, passwordHash, JSON.stringify({ display_name: input.displayName.trim() })],
    );
    const id = user.rows[0].id;
    await client.query(
      "UPDATE public.profiles SET locale = $2, accepted_terms_at = now() WHERE id = $1",
      [id, locale],
    );
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
  const copy = mailCopy(locale, input.displayName.trim(), `${appOrigin()}/account/verifieer?token=${token}`, "verify");
  await sendAuthMail({ recipientEmail: email, subject: copy.subject, body: copy.body });
  return { message: genericRegister };
}

export async function resendVerification(email: string, clientKey: string) {
  assertLocalAuthAllowed();
  assertMailAllowed();
  await assertRateLimit("resend", clientKey);
  const normalized = normalizeEmail(email);
  if (!validEmail(normalized)) return { message: genericResend };
  const found = await withService((client) =>
    client.query<{ id: string; display_name: string; locale: string }>(
      `SELECT u.id, p.display_name, p.locale
       FROM auth.users u
       JOIN public.profiles p ON p.id = u.id
       WHERE u.email = $1 AND u.email_confirmed_at IS NULL`,
      [normalized],
    ),
  );
  const user = found.rows[0];
  if (!user) return { message: genericResend };
  await withService((client) =>
    client.query(
      `UPDATE auth.local_tokens SET used_at = now()
       WHERE user_id = $1 AND purpose = 'verify_email' AND used_at IS NULL`,
      [user.id],
    ),
  );
  const token = await issueToken(user.id, "verify_email", 24);
  const locale = localeOf(user.locale);
  const copy = mailCopy(locale, user.display_name, `${appOrigin()}/account/verifieer?token=${token}`, "verify");
  await sendAuthMail({ recipientEmail: normalized, subject: copy.subject, body: copy.body });
  return { message: genericResend };
}

export async function verifyEmailToken(token: string) {
  assertLocalAuthAllowed();
  const tokenHash = hashSessionToken(token);
  return withService(async (client) => {
    const found = await client.query<{ user_id: string }>(
      `UPDATE auth.local_tokens SET used_at = now()
       WHERE token_hash = $1 AND purpose = 'verify_email' AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [tokenHash],
    );
    const userId = found.rows[0]?.user_id;
    if (!userId) return false;
    await client.query("UPDATE auth.users SET email_confirmed_at = now() WHERE id = $1 AND email_confirmed_at IS NULL", [userId]);
    const onboarding = await client.query<{
      trade_name: string;
      kbo_number: string;
      vat_number: string;
      postal_code: string;
      city: string;
    }>("SELECT trade_name, kbo_number, vat_number, postal_code, city FROM professional_onboardings WHERE user_id = $1", [userId]);
    const garage = onboarding.rows[0];
    if (garage) {
      const profile = await client.query<{ email: string }>(
        "SELECT email FROM auth.users WHERE id = $1",
        [userId],
      );
      const created = await client.query<{ id: string }>(
        `INSERT INTO public.garages (
           name, trade_name, owner_user_id, verification_status, is_public, kbo_number, vat_number,
           contact_email, postal_code, city
         ) VALUES ($1, $1, $2, 'unverified', false, $3, $4, $5, $6, $7) RETURNING id`,
        [
          garage.trade_name,
          userId,
          garage.kbo_number,
          garage.vat_number,
          profile.rows[0]?.email,
          garage.postal_code,
          garage.city,
        ],
      );
      await client.query(
        `INSERT INTO public.garage_members (garage_id, user_id, role) VALUES ($1, $2, 'owner')`,
        [created.rows[0].id, userId],
      );
      await client.query("UPDATE public.profiles SET account_kind = 'professional' WHERE id = $1", [userId]);
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
  assertLocalAuthAllowed();
  if (supabaseConfigured()) {
    const remote = await import("@/lib/supabase/auth");
    return remote.loginWithSupabase(email, password);
  }
  await assertRateLimit("login", clientKey);
  await assertRateLimit("login-email", normalizeEmail(email));
  const normalized = normalizeEmail(email);
  const found = await withService((client) =>
    client.query<{ id: string; encrypted_password: string; email_confirmed_at: string | null }>(
      "SELECT id, encrypted_password, email_confirmed_at FROM auth.users WHERE email = $1",
      [normalized],
    ),
  );
  const row = found.rows[0];
  const passwordOk = await verifyPassword(row?.encrypted_password ?? (await dummyPasswordHash()), password);
  if (!row || !row.email_confirmed_at || !passwordOk) throw new AccountInputError(genericLogin);
  const token = await insertLocalSession(row.id);
  return { token };
}

export async function logoutAccount(token: string) {
  if (!token) return;
  await withService((client) =>
    client.query("UPDATE auth.local_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL", [
      hashSessionToken(token),
    ]),
  );
}

export async function requestPasswordReset(email: string, clientKey: string) {
  assertLocalAuthAllowed();
  assertMailAllowed();
  await assertRateLimit("recovery", clientKey);
  const normalized = normalizeEmail(email);
  const found = await withService((client) =>
    client.query<{ id: string; display_name: string; locale: string }>(
      `SELECT u.id, p.display_name, p.locale
       FROM auth.users u JOIN public.profiles p ON p.id = u.id
       WHERE u.email = $1 AND u.email_confirmed_at IS NOT NULL`,
      [normalized],
    ),
  );
  const user = found.rows[0];
  if (!user) return { message: genericRecovery };
  const token = await issueToken(user.id, "reset_password", 1);
  const copy = mailCopy(localeOf(user.locale), user.display_name, `${appOrigin()}/account/herstel/bevestigen?token=${token}`, "reset");
  await sendAuthMail({ recipientEmail: normalized, subject: copy.subject, body: copy.body });
  return { message: genericRecovery };
}

export async function confirmPasswordReset(token: string, password: string, passwordConfirm = "") {
  assertLocalAuthAllowed();
  if (passwordConfirm !== password) throw new AccountFieldError({ passwordConfirm: "De wachtwoorden komen niet overeen." });
  if (!validPassword(password)) throw new AccountFieldError({ password: "Het nieuwe wachtwoord moet minstens 12 tekens zijn." });
  const tokenHash = hashSessionToken(token);
  const passwordHash = await hashPassword(password);
  const updated = await withService(async (client) => {
    const found = await client.query<{ user_id: string }>(
      `UPDATE auth.local_tokens SET used_at = now()
       WHERE token_hash = $1 AND purpose = 'reset_password' AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [tokenHash],
    );
    const userId = found.rows[0]?.user_id;
    if (!userId) return false;
    await client.query("UPDATE auth.users SET encrypted_password = $2, updated_at = now() WHERE id = $1", [userId, passwordHash]);
    await client.query("UPDATE auth.local_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [userId]);
    return true;
  });
  if (!updated) throw new AccountInputError("Deze herstellink is ongeldig of al gebruikt.");
}

export async function createGarageClaim(actor: Actor, kboNumber: string, evidence: string) {
  const kbo = kboNumber.replace(/[\s.]/g, "");
  if (!validKbo(kbo) || evidence.trim().length < 20) {
    throw new AccountInputError("Vul een KBO van 10 cijfers en een toelichting van minstens 20 tekens in.");
  }
  await withTransaction(actorAccess(actor), (client) =>
    client.query(
      `INSERT INTO garage_claim_requests (claimant_user_id, claimed_kbo, evidence) VALUES ($1, $2, $3)`,
      [actor.userId, kbo, evidence.trim()],
    ),
  );
}

export async function readOwnProfile(actor: Actor) {
  return withTransaction(actorAccess(actor), async (client) => {
    const profile = await client.query<{ display_name: string; locale: string; account_kind: string }>(
      "SELECT display_name, locale, account_kind FROM public.profiles WHERE id = $1",
      [actor.userId],
    );
    const garage = actor.dealerId
      ? await client.query<{
          trade_name: string | null;
          verification_status: string;
          is_public: boolean;
          kbo_number: string | null;
          city: string | null;
        }>(
          `SELECT trade_name, verification_status, is_public, kbo_number, city FROM public.garages WHERE id = $1`,
          [actor.dealerId],
        )
      : { rows: [] };
    return {
      email: actor.email,
      role: actor.role,
      displayName: profile.rows[0]?.display_name ?? "",
      locale: profile.rows[0]?.locale ?? "nl",
      accountKind: profile.rows[0]?.account_kind ?? "private",
      garage: garage.rows[0] ?? null,
    };
  });
}
