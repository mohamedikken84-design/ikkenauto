import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { after, before, describe, it } from "node:test";
import { closePool, getPool, withTransaction } from "@/lib/db/client";
import { handleClaim, handleLogin, handleLogout, handleRecovery, handleRecoveryConfirm, handleRegister, handleSession, handleVerify, handleCsrf } from "@/lib/dealer/auth-http";
import { resolveActor } from "@/lib/dealer/auth";
import { migrate } from "../../scripts/migrate";

const execFileAsync = promisify(execFile);
const origin = "http://127.0.0.1:3000";

describe("registratie en lokale auth", () => {
  const previous = {
    auth: process.env.AUTH_MODE,
    mail: process.env.MAIL_TRANSPORT,
    app: process.env.APP_ORIGIN,
    limit: process.env.AUTH_RATE_LIMIT_MAX,
    node: process.env.NODE_ENV,
  };

  before(async () => {
    process.env.AUTH_MODE = "development-session";
    process.env.MAIL_TRANSPORT = "local";
    process.env.APP_ORIGIN = origin;
    setNodeEnv("test");
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ontbreekt. Geen fallback.");
    await migrate();
    await resetTables();
  });

  after(async () => {
    process.env.AUTH_MODE = previous.auth;
    process.env.MAIL_TRANSPORT = previous.mail;
    process.env.APP_ORIGIN = previous.app;
    process.env.AUTH_RATE_LIMIT_MAX = previous.limit;
    setNodeEnv(previous.node);
    await closePool();
  });

  it("registreert, bevestigt, meldt aan, meldt af en weigert de ingetrokken sessie", async () => {
    const context = await csrf("198.51.100.10");
    const email = "particulier@example.test";
    const password = "lokaal-wachtwoord-12";
    const created = await handleRegister(post("/api/auth/register", context, {
      kind: "particulier",
      displayName: "Particulier Test",
      email,
      password,
    }));
    assert.equal(created.status, 200);
    assert.equal(await count("users"), 1);
    assert.equal(await count("dealers"), 0);
    assert.equal(await count("sessions"), 0);

    const token = await latestToken();
    const verified = await handleVerify(post("/api/auth/verify", context, { token }));
    assert.equal(verified.status, 200);
    const role = await getPool().query<{ role: string }>("SELECT role FROM users WHERE email = $1", [email]);
    assert.equal(role.rows[0].role, "private_user");

    const login = await handleLogin(post("/api/auth/login", context, { email, password }));
    assert.equal(login.status, 200);
    const session = cookieValue(login.headers.get("set-cookie") ?? "", "ikken_session");
    assert.match(login.headers.get("set-cookie") ?? "", /HttpOnly/);
    assert.ok(await resolveActor(session));

    const logout = await handleLogout(post("/api/auth/logout", context, {}, session));
    assert.equal(logout.status, 200);
    assert.equal(await resolveActor(session), null);
    const sessionView = await handleSession(new Request(`${origin}/api/auth/session`, { headers: { cookie: `ikken_session=${session}` } }));
    assert.deepEqual(await sessionView.json(), { account: null });
  });

  it("maakt een professionele garage niet openbaar en laat geen bestaande garage overnemen", async () => {
    const context = await csrf("198.51.100.11");
    const email = "garage@example.test";
    const registered = await handleRegister(post("/api/auth/register", context, {
      kind: "professioneel",
      displayName: "Garagehouder",
      email,
      password: "lokaal-wachtwoord-12",
      tradeName: "Testgarage",
      kboNumber: "0123456789",
      vatNumber: "BE0123456789",
      postalCode: "2000",
      city: "Antwerpen",
      role: "platform_admin",
    }));
    assert.equal(registered.status, 400);
    assert.equal(await count("users"), 1);

    const ok = await handleRegister(post("/api/auth/register", await csrf("198.51.100.12"), {
      kind: "professioneel",
      displayName: "Garagehouder",
      email,
      password: "lokaal-wachtwoord-12",
      tradeName: "Testgarage",
      kboNumber: "0123456789",
      vatNumber: "BE0123456789",
      postalCode: "2000",
      city: "Antwerpen",
    }));
    assert.equal(ok.status, 200);
    const again = await handleRegister(post("/api/auth/register", await csrf("198.51.100.13"), {
      kind: "particulier",
      displayName: "Dubbel",
      email,
      password: "lokaal-wachtwoord-12",
    }));
    assert.equal(again.status, 200);
    assert.equal(await count("users"), 2);

    const token = await latestToken();
    assert.equal((await handleVerify(post("/api/auth/verify", context, { token }))).status, 200);
    const dealer = await getPool().query<{ verification_status: string; is_public: boolean; owner_user_id: string }>(
      "SELECT verification_status, is_public, owner_user_id FROM dealers WHERE trade_name = 'Testgarage'",
    );
    assert.equal(dealer.rows[0].verification_status, "unverified");
    assert.equal(dealer.rows[0].is_public, false);
    const ownerBefore = dealer.rows[0].owner_user_id;

    const login = await handleLogin(post("/api/auth/login", await csrf("198.51.100.14"), { email, password: "lokaal-wachtwoord-12" }));
    const session = cookieValue(login.headers.get("set-cookie") ?? "", "ikken_session");
    const claimContext = await csrf("198.51.100.15");
    const claim = await handleClaim(post("/api/auth/claim", claimContext, {
      kboNumber: "9876543210",
      evidence: "Dit is een testaanvraag met voldoende toelichting.",
    }, session));
    assert.equal(claim.status, 200);
    const ownerAfter = await getPool().query<{ owner_user_id: string }>("SELECT owner_user_id FROM dealers WHERE trade_name = 'Testgarage'");
    assert.equal(ownerAfter.rows[0].owner_user_id, ownerBefore);
    const hiddenClaims = await getPool().query("SELECT id FROM garage_claim_requests");
    assert.equal(hiddenClaims.rows.length, 0);
    const claims = await withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, (client) =>
      client.query<{ status: string; claimed_kbo: string }>("SELECT status, claimed_kbo FROM garage_claim_requests"),
    );
    assert.equal(claims.rows.length, 1);
    assert.equal(claims.rows[0].status, "pending");
    assert.equal(claims.rows[0].claimed_kbo, "9876543210");

    const { createOwnVehicle, listPublishedVehicles, updateOwnVehicle, StockValidationError } = await import("@/lib/dealer/stock");
    const actor = await resolveActor(session);
    assert.ok(actor);
    assert.equal(actor.role, "dealer_admin");
    const created = await createOwnVehicle(actor, {
      make: "Testmerk",
      model: "Testmodel",
      version: "1.0",
      priceEur: 12500,
      mileageKm: 42000,
      firstRegistration: "2020-04",
      fuel: "benzine",
      transmission: "manueel",
      body: "hatchback",
      powerKw: 81,
      postalCode: "2000",
      city: "Antwerpen",
      vatRegime: "marge",
      description: "Fictieve testwagen, geen echte voorraad",
    });
    await assert.rejects(() => updateOwnVehicle(actor, created.id, { publicationStatus: "published" }), StockValidationError);
    assert.equal((await listPublishedVehicles()).some((vehicle) => vehicle.id === created.id), false);
    const hidden = await withTransaction({ dealerId: null, role: "public", publicRead: true }, (client) =>
      client.query("SELECT display_name FROM private_profiles"),
    );
    assert.equal(hidden.rows.length, 0);
  });

  it("herstel werkt eenmalig, vervalt, en trekt sessies in", async () => {
    const email = "herstel@example.test";
    const context = await csrf("198.51.100.20");
    await handleRegister(post("/api/auth/register", context, {
      kind: "particulier",
      displayName: "Herstel",
      email,
      password: "lokaal-wachtwoord-12",
    }));
    await handleVerify(post("/api/auth/verify", context, { token: await latestToken() }));
    const login = await handleLogin(post("/api/auth/login", await csrf("198.51.100.21"), { email, password: "lokaal-wachtwoord-12" }));
    const session = cookieValue(login.headers.get("set-cookie") ?? "", "ikken_session");
    await handleRecovery(post("/api/auth/recovery", await csrf("198.51.100.22"), { email }));
    const reset = await latestToken();
    const confirm = await handleRecoveryConfirm(post("/api/auth/recovery/confirm", await csrf("198.51.100.23"), {
      token: reset,
      password: "nieuw-wachtwoord-12",
    }));
    assert.equal(confirm.status, 200);
    assert.equal(await resolveActor(session), null);
    const reused = await handleRecoveryConfirm(post("/api/auth/recovery/confirm", await csrf("198.51.100.24"), {
      token: reset,
      password: "nog-een-wachtwoord-12",
    }));
    assert.equal(reused.status, 400);
    await getPool().query("UPDATE auth_tokens SET expires_at = now() - interval '1 minute' WHERE used_at IS NULL");
    await handleRecovery(post("/api/auth/recovery", await csrf("198.51.100.25"), { email }));
    const expired = await latestToken();
    await getPool().query("UPDATE auth_tokens SET expires_at = now() - interval '1 minute' WHERE token_hash = $1", [
      (await import("@/lib/dealer/auth")).hashSessionToken(expired),
    ]);
    const late = await handleRecoveryConfirm(post("/api/auth/recovery/confirm", await csrf("198.51.100.26"), {
      token: expired,
      password: "ander-wachtwoord-12",
    }));
    assert.equal(late.status, 400);
  });

  it("schrijft niets bij validatiefouten, beperkt pogingen en sluit productie", async () => {
    const beforeUsers = await count("users");
    const bad = await handleRegister(post("/api/auth/register", await csrf("198.51.100.30"), {
      kind: "particulier",
      displayName: "Kort",
      email: "kort@example.test",
      password: "kort",
    }));
    assert.equal(bad.status, 400);
    assert.equal(await count("users"), beforeUsers);

    process.env.AUTH_RATE_LIMIT_MAX = "2";
    const limited = await csrf("198.51.100.31");
    await handleRegister(post("/api/auth/register", limited, { kind: "nee", displayName: "A", email: "a@example.test", password: "lokaal-wachtwoord-12" }));
    await handleRegister(post("/api/auth/register", limited, { kind: "nee", displayName: "A", email: "a@example.test", password: "lokaal-wachtwoord-12" }));
    const blocked = await handleRegister(post("/api/auth/register", limited, { kind: "particulier", displayName: "A", email: "nieuw@example.test", password: "lokaal-wachtwoord-12" }));
    assert.equal(blocked.status, 429);
    assert.equal(await count("users"), beforeUsers);
    delete process.env.AUTH_RATE_LIMIT_MAX;

    process.env.AUTH_MODE = "production";
    process.env.MAIL_TRANSPORT = "local";
    try {
      const closed = await handleRegister(post("/api/auth/register", await csrf("198.51.100.32"), {
        kind: "particulier",
        displayName: "Productie",
        email: "productie@example.test",
        password: "lokaal-wachtwoord-12",
      }));
      assert.equal(closed.status, 503);
      process.env.AUTH_MODE = "development-session";
      setNodeEnv("production");
      const nodeClosed = await handleRegister(post("/api/auth/register", await csrf("198.51.100.33"), {
        kind: "particulier",
        displayName: "Productie",
        email: "productie-node@example.test",
        password: "lokaal-wachtwoord-12",
      }));
      assert.equal(nodeClosed.status, 503);
      const sessionsBefore = await count("sessions");
      const loginClosed = await handleLogin(post("/api/auth/login", await csrf("198.51.100.34"), {
        email: "particulier@example.test",
        password: "lokaal-wachtwoord-12",
      }));
      assert.equal(loginClosed.status, 503);
      assert.equal(await count("sessions"), sessionsBefore);
      assert.equal(await count("users"), beforeUsers);
    } finally {
      process.env.AUTH_MODE = "development-session";
      process.env.MAIL_TRANSPORT = "local";
      setNodeEnv("test");
    }
  });

  it("bewaart het account na een herstart van PostgreSQL", async () => {
    const email = "duurzaam-account@example.test";
    await handleRegister(post("/api/auth/register", await csrf("198.51.100.40"), {
      kind: "particulier",
      displayName: "Duurzaam",
      email,
      password: "lokaal-wachtwoord-12",
    }));
    await closePool();
    await execFileAsync("sudo", ["pg_ctlcluster", "16", "main", "restart"]);
    const found = await getPool().query("SELECT id FROM users WHERE email = $1", [email]);
    assert.equal(found.rows.length, 1);
  });
});

function setNodeEnv(value: string | undefined) {
  const env = process.env as { NODE_ENV?: string };
  if (value === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = value;
}

async function resetTables() {
  await getPool().query(
    `TRUNCATE garage_claim_requests, local_mail_messages, auth_tokens, auth_rate_limits, professional_onboardings,
      private_profiles, password_credentials, availability_bookings, location_opening_exceptions, location_opening_hours,
      bookable_resources, locations, stock_import_rows, vehicles, stock_import_batches, sessions, users, dealers
     RESTART IDENTITY CASCADE`,
  );
}

async function csrf(ip: string) {
  const response = handleCsrf();
  const body = (await response.json()) as { token: string };
  const cookie = (response.headers.get("set-cookie") ?? "").split(";")[0];
  return { token: body.token, cookie, ip };
}

function post(path: string, context: { token: string; cookie: string; ip: string }, body: object, session = "") {
  const cookie = session ? `${context.cookie}; ikken_session=${session}` : context.cookie;
  return new Request(`http://127.0.0.1:3000${path}`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      cookie,
      "x-forwarded-for": context.ip,
    },
    body: JSON.stringify({ ...body, csrf: context.token }),
  });
}

async function count(table: string) {
  const result = await getPool().query<{ count: string }>(`SELECT count(*)::text AS count FROM ${table}`);
  return Number(result.rows[0].count);
}

async function latestToken() {
  const result = await getPool().query<{ body: string }>(
    "SELECT body FROM local_mail_messages ORDER BY created_at DESC LIMIT 1",
  );
  const match = /token=([A-Za-z0-9_-]+)/.exec(result.rows[0]?.body ?? "");
  if (!match) throw new Error("geen testtoken");
  return match[1];
}

function cookieValue(header: string, name: string) {
  const match = new RegExp(`${name}=([^;]+)`).exec(header);
  return match?.[1] ?? "";
}
