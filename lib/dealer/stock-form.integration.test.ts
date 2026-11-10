import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { withService } from "@/lib/db/client";
import { insertLocalSession } from "@/lib/dealer/auth";
import { handleDeleteStock, handleGetStock, handleUpdateStock } from "@/lib/dealer/stock-http";
import { createOwnVehicle, listOwnStock, listPublishedVehicles } from "@/lib/dealer/stock";
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
  description: "Concept",
  color: "grijs",
  doors: 5,
  seats: 5,
  co2Gkm: 118,
  euroNorm: "Euro 6d",
  equipment: ["airco", "navigatie"],
  warrantyMonths: 12,
  inspectionValidUntil: "2027-06-01",
  previousOwners: 1,
  descriptionNl: "Nederlandse tekst",
  descriptionFr: "Texte français",
  vin: "WVWZZZ1KZAW000001",
  licensePlate: "1-ABC-123",
  sourceStockId: "FORM-1",
};

describe("voorraadformulier", () => {
  before(async () => {
    process.env.AUTH_MODE = "development-session";
    process.env.MAIL_TRANSPORT = "local";
    process.env.APP_ORIGIN = "http://127.0.0.1:3000";
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ontbreekt.");
    await migrate();
  });

  it("bewaart listingvelden en houdt het VIN uit de publieke lijst", async () => {
    const garage = await createGarage("Formuliergarage");
    const owner = await createMember(garage, "formulier@example.test");
    const other = await createMember(await createGarage("Andere garage"), "andere-formulier@example.test");
    const created = await createOwnVehicle(owner, sample);
    assert.equal(created.sourceStockId, "FORM-1");
    assert.equal(created.color, "grijs");
    assert.equal(created.vatDeductible, true);
    assert.equal(created.equipment.join(","), "airco,navigatie");
    assert.equal("vin" in created, false);

    const own = await handleGetStock(auth(owner), created.id);
    const ownBody = (await own.json()) as { vehicle: { vin: string; licensePlate: string } };
    assert.equal(ownBody.vehicle.vin, "WVWZZZ1KZAW000001");
    assert.equal(ownBody.vehicle.licensePlate, "1ABC123");

    const hidden = await handleGetStock(auth(other), created.id);
    assert.equal(hidden.status, 404);
    const published = JSON.stringify(await listPublishedVehicles());
    assert.equal(published.includes("WVWZZZ1KZAW000001"), false);
    assert.equal(published.includes(created.id), false);

    const saved = await handleUpdateStock(jsonRequest(owner, { color: "blauw", priceEur: 18000 }), created.id);
    assert.equal(saved.status, 200);
    const again = (await listOwnStock(owner)).find((item) => item.id === created.id);
    assert.equal(again?.color, "blauw");
    assert.equal(again?.priceEur, 18000);

    const archived = await handleUpdateStock(jsonRequest(owner, { publicationStatus: "archived" }), created.id);
    assert.equal(archived.status, 200);
    assert.equal((await listOwnStock(owner)).find((item) => item.id === created.id)?.publicationStatus, "archived");

    const removed = await handleDeleteStock(auth(owner), created.id);
    assert.equal(removed.status, 200);
    assert.equal((await listOwnStock(owner)).some((item) => item.id === created.id), false);
    const tombstone = await withService((client) =>
      client.query<{ deleted_at: string | null }>("SELECT deleted_at FROM vehicles WHERE id = $1", [created.id]),
    );
    assert.ok(tombstone.rows[0]?.deleted_at);

    const audit = await withService((client) =>
      client.query<{ diff: { vin?: string } }>("SELECT diff FROM audit_log WHERE entity_id = $1", [created.id]),
    );
    assert.equal(audit.rows.some((row) => row.diff.vin), false);
  });
});

async function createGarage(name: string) {
  const result = await withService((client) =>
    client.query<{ id: string }>(
      "INSERT INTO garages (name, verification_status, is_public) VALUES ($1, 'verified', true) RETURNING id",
      [name],
    ),
  );
  return result.rows[0].id;
}

async function createMember(garageId: string, email: string): Promise<Actor> {
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
  } as Actor & { token: string };
}

function auth(actor: Actor & { token?: string }) {
  return new Request("http://127.0.0.1:3000/api/dealer/stock", {
    headers: { authorization: `Bearer ${actor.token}` },
  });
}

function jsonRequest(actor: Actor & { token?: string }, body: unknown) {
  return new Request("http://127.0.0.1:3000/api/dealer/stock/id", {
    method: "PATCH",
    headers: { authorization: `Bearer ${actor.token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
