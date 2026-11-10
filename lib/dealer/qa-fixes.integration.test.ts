import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, describe, it } from "node:test";
import { withService, withTransaction } from "@/lib/db/client";
import { hashSessionToken, insertLocalSession } from "@/lib/dealer/auth";
import { handleExchange, handleVerify } from "@/lib/dealer/auth-http";
import { migrate } from "../../scripts/migrate";

describe("qa-fixes", () => {
  before(async () => {
    process.env.AUTH_MODE = "development-session";
    process.env.MAIL_TRANSPORT = "local";
    process.env.APP_ORIGIN = "http://127.0.0.1:3000";
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ontbreekt.");
    await migrate();
  });

  it("laat staff is_public en owner_user_id niet wijzigen", async () => {
    const stamp = Date.now();
    const owner = await insertUser(`owner-${stamp}@example.test`);
    const staff = await insertUser(`staff-${stamp}@example.test`);
    const garage = await withService((client) =>
      client.query<{ id: string }>(
        `INSERT INTO garages (name, trade_name, verification_status, is_public, owner_user_id)
         VALUES ('QA', 'QA Garage', 'verified', false, $1) RETURNING id`,
        [owner],
      ),
    );
    const garageId = garage.rows[0].id;
    await withService((client) =>
      client.query(
        `INSERT INTO garage_members (garage_id, user_id, role) VALUES ($1, $2, 'owner'), ($1, $3, 'staff')`,
        [garageId, owner, staff],
      ),
    );

    await assert.rejects(
      withTransaction({ userId: staff, access: "authenticated" }, (client) =>
        client.query("UPDATE garages SET is_public = true WHERE id = $1", [garageId]),
      ),
      /owner mag de garage publiceren/,
    );
    await assert.rejects(
      withTransaction({ userId: staff, access: "authenticated" }, (client) =>
        client.query("UPDATE garages SET owner_user_id = $2 WHERE id = $1", [garageId, staff]),
      ),
      /eigenaar wijzigen/,
    );
    await withTransaction({ userId: owner, access: "authenticated" }, (client) =>
      client.query("UPDATE garages SET trade_name = 'Nog van de owner' WHERE id = $1", [garageId]),
    );
    const row = await withService((client) =>
      client.query<{ is_public: boolean; owner_user_id: string; trade_name: string }>(
        "SELECT is_public, owner_user_id, trade_name FROM garages WHERE id = $1",
        [garageId],
      ),
    );
    assert.equal(row.rows[0].is_public, false);
    assert.equal(row.rows[0].owner_user_id, owner);
    assert.equal(row.rows[0].trade_name, "Nog van de owner");
  });

  it("maakt twee sessies in dezelfde seconde", async () => {
    const user = await insertUser(`sessie-${Date.now()}@example.test`);
    const first = await insertLocalSession(user);
    const second = await insertLocalSession(user);
    assert.notEqual(first, second);
  });

  it("wisselt een token om naar een cookie en haalt hem uit de url", async () => {
    const user = await insertUser(`token-${Date.now()}@example.test`);
    await withService((client) => client.query("UPDATE auth.users SET email_confirmed_at = now() WHERE id = $1", [user]));
    const raw = `ruw-token-${Date.now()}-abcdef`;
    await withService((client) =>
      client.query(
        `INSERT INTO auth.local_tokens (user_id, purpose, token_hash, expires_at)
         VALUES ($1, 'verify_email', $2, now() + interval '1 hour')`,
        [user, hashSessionToken(raw)],
      ),
    );
    const exchanged = await handleExchange(new Request(`http://127.0.0.1:3000/api/auth/exchange?purpose=verify&token=${raw}`));
    assert.equal(exchanged.status, 303);
    const location = new URL(exchanged.headers.get("location") ?? "");
    assert.equal(location.pathname, "/account/verifieer");
    assert.equal(location.search, "");
    const cookie = exchanged.headers.get("set-cookie") ?? "";
    assert.match(cookie, /ikken_verify_token=/);
    assert.equal(cookie.includes(raw), false);
    const again = await handleExchange(new Request(`http://127.0.0.1:3000/api/auth/exchange?purpose=verify&token=${raw}`));
    assert.equal((again.headers.get("set-cookie") ?? "").includes("ikken_verify_token="), false);

    const secret = /ikken_verify_token=([^;]+)/.exec(cookie)?.[1] ?? "";
    const verified = await handleVerify(
      new Request("http://127.0.0.1:3000/api/auth/verify", {
        method: "POST",
        headers: {
          origin: "http://127.0.0.1:3000",
          "content-type": "application/json",
          cookie: `ikken_csrf=csrf-test; ikken_verify_token=${secret}`,
        },
        body: JSON.stringify({ csrf: "csrf-test" }),
      }),
    );
    assert.equal(verified.status, 200);
    const page = await readFile("app/account/herstel/bevestigen/page.tsx", "utf8");
    assert.equal(page.includes('name="token"'), false);
  });
});

async function insertUser(email: string) {
  const result = await withService((client) =>
    client.query<{ id: string }>(
      `INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
       VALUES ($1, 'geen-login', '{"display_name":"QA"}') RETURNING id`,
      [email],
    ),
  );
  return result.rows[0].id;
}
