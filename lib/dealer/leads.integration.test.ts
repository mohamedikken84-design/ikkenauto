import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { withService } from "@/lib/db/client";
import { insertLocalSession } from "@/lib/dealer/auth";
import { handleCreateLead, handleListLeads, handleUpdateLead } from "@/lib/dealer/leads-http";
import { createOwnVehicle } from "@/lib/dealer/stock";
import type { Actor, StockInput } from "@/lib/dealer/types";
import { migrate } from "../../scripts/migrate";

const sample: StockInput = {
  make: "Volkswagen",
  model: "Golf",
  version: "Life",
  priceEur: 18950,
  mileageKm: 45230,
  firstRegistration: "2020-03",
  fuel: "benzine",
  transmission: "manueel",
  body: "hatchback",
  powerKw: 110,
  postalCode: "2000",
  city: "Antwerpen",
  vatRegime: "btw-aftrekbaar",
  description: "Lead",
};

describe("leads", () => {
  const previous = process.env.PUBLIC_CLOSED;

  before(async () => {
    process.env.AUTH_MODE = "development-session";
    process.env.MAIL_TRANSPORT = "local";
    process.env.APP_ORIGIN = "http://127.0.0.1:3000";
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ontbreekt.");
    await migrate();
  });

  after(() => {
    if (previous === undefined) delete process.env.PUBLIC_CLOSED;
    else process.env.PUBLIC_CLOSED = previous;
  });

  it("weigert een aanvraag zolang de site gesloten is en isoleert de inbox", async () => {
    const stamp = Date.now();
    const garage = await createGarage("Leadgarage", true);
    const owner = await createMember(garage, `lead-${stamp}@example.test`);
    const other = await createMember(await createGarage("Andere leadgarage"), `andere-lead-${stamp}@example.test`);
    const vehicle = await createOwnVehicle(owner, sample);
    await withService((client) =>
      client.query(
        `UPDATE vehicles SET publication_status = 'published', fictional = false WHERE id = $1`,
        [vehicle.id],
      ),
    );

    delete process.env.PUBLIC_CLOSED;
    const closed = await handleCreateLead(post({ ...leadBody(vehicle.id), consent: true }));
    assert.equal(closed.status, 403);

    process.env.PUBLIC_CLOSED = "false";
    await withService((client) => client.query("UPDATE app_settings SET value = 'false'::jsonb WHERE key = 'public_closed'"));
    const honeypot = await handleCreateLead(post({ ...leadBody(vehicle.id), consent: true, company: "bot" }));
    assert.equal(honeypot.status, 201);

    const created = await handleCreateLead(post({ ...leadBody(vehicle.id), consent: true, name: "Sam", email: "sam@example.test" }));
    assert.equal(created.status, 201);
    const body = (await created.json()) as { id: string };
    const own = await handleListLeads(auth(owner));
    const ownBody = (await own.json()) as { leads: Array<{ id: string; name: string }> };
    assert.equal(ownBody.leads.some((lead) => lead.id === body.id && lead.name === "Sam"), true);
    const hidden = await handleListLeads(auth(other));
    const hiddenBody = (await hidden.json()) as { leads: unknown[] };
    assert.equal(hiddenBody.leads.length, 0);

    const updated = await handleUpdateLead(patch(owner, { status: "in_progress" }), body.id);
    assert.equal(updated.status, 200);
    const event = await withService((client) =>
      client.query("SELECT id FROM vehicle_events WHERE vehicle_id = $1 AND event_type = 'contact'", [vehicle.id]),
    );
    assert.equal(event.rows.length, 1);

    await withService((client) => client.query("UPDATE app_settings SET value = 'true'::jsonb WHERE key = 'public_closed'"));
  });
});

function leadBody(vehicleId: string) {
  return {
    vehicleId,
    name: "Test",
    email: "koper@example.test",
    message: "Is deze auto nog beschikbaar?",
  };
}

async function createGarage(name: string, open = false) {
  const result = await withService((client) =>
    client.query<{ id: string }>(
      "INSERT INTO garages (name, verification_status, is_public) VALUES ($1, $2, $3) RETURNING id",
      [name, open ? "verified" : "unverified", open],
    ),
  );
  return result.rows[0].id;
}

async function createMember(garageId: string, email: string): Promise<Actor & { token: string }> {
  const user = await withService((client) =>
    client.query<{ id: string }>(
      `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
       VALUES ($1, 'geen-login', now(), '{"display_name":"Tester"}') RETURNING id`,
      [email],
    ),
  );
  await withService((client) =>
    client.query("INSERT INTO garage_members (garage_id, user_id, role) VALUES ($1, $2, 'owner')", [garageId, user.rows[0].id]),
  );
  return {
    userId: user.rows[0].id,
    role: "dealer_admin",
    dealerId: garageId,
    email,
    token: await insertLocalSession(user.rows[0].id),
  };
}

function post(body: Record<string, unknown>) {
  return new Request("http://127.0.0.1:3000/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.10" },
    body: JSON.stringify(body),
  });
}

function auth(actor: Actor & { token: string }) {
  return new Request("http://127.0.0.1:3000/api/dealer/leads", {
    headers: { authorization: `Bearer ${actor.token}` },
  });
}

function patch(actor: Actor & { token: string }, body: unknown) {
  return new Request("http://127.0.0.1:3000/api/dealer/leads/id", {
    method: "PATCH",
    headers: { authorization: `Bearer ${actor.token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
