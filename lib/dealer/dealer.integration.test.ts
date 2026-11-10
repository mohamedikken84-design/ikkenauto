import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { after, before, describe, it } from "node:test";
import { closePool, withService, withTransaction } from "@/lib/db/client";
import { importDealerCsv } from "@/lib/dealer/import-stock";
import { createOwnVehicle, listOwnStock, listPublishedVehicles, updateOwnVehicle } from "@/lib/dealer/stock";
import {
  handleAdminListStock,
  handleCreateStock,
  handleImportStock,
  handleListStock,
  handleUpdateStock,
} from "@/lib/dealer/stock-http";
import type { Actor, StockInput } from "@/lib/dealer/types";
import { insertLocalSession } from "@/lib/dealer/auth";
import { migrate } from "../../scripts/migrate";

const execFileAsync = promisify(execFile);
const sample: StockInput = {
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
};

const csvHeader =
  "source_stock_id,make,model,version,price_eur,mileage_km,first_registration,fuel,transmission,body,power_kw,postal_code,city,vat_regime,description,dealer_id";

describe("dealerstock", () => {
  before(async () => {
    process.env.AUTH_MODE = "development-session";
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL ontbreekt. Integratietests weigeren een fallback.");
    }
    await migrate();
    await resetTables();
  });

  after(async () => {
    await closePool();
  });

  it("isoleert voorraad van dealer A en B op de server en in de database", async () => {
    const dealerA = await createDealer("Dealer A");
    const dealerB = await createDealer("Dealer B");
    const adminA = await createUser(dealerA, "dealer_admin", "a-admin@example.test");
    const staffA = await createUser(dealerA, "dealer_staff", "a-staff@example.test");
    const adminB = await createUser(dealerB, "dealer_admin", "b-admin@example.test");
    const platform = await createUser(null, "platform_admin", "platform@example.test");

    const created = await handleCreateStock(
      jsonRequest(adminA.token, { ...sample, dealerId: dealerB }),
    );
    assert.equal(created.status, 201);
    const vehicle = (await created.json()).vehicle as { id: string; dealerId: string };
    assert.equal(vehicle.dealerId, dealerA);

    const listA = await handleListStock(authRequest(adminA.token));
    const bodyA = (await listA.json()) as { vehicles: { id: string }[] };
    assert.equal(bodyA.vehicles.length, 1);

    const listB = await handleListStock(authRequest(adminB.token));
    const bodyB = (await listB.json()) as { vehicles: { id: string }[] };
    assert.equal(bodyB.vehicles.length, 0);

    const stolen = await handleUpdateStock(jsonRequest(adminB.token, { priceEur: 999 }), vehicle.id);
    assert.equal(stolen.status, 404);

    const staffImport = await handleImportStock(
      new Request("http://localhost/api/dealer/import", {
        method: "POST",
        headers: { authorization: `Bearer ${staffA.token}`, "content-type": "text/csv" },
        body: `${csvHeader}\nS-1,Testmerk,Testmodel,1.0,13000,1000,2021-01,benzine,manueel,hatchback,70,2000,Antwerpen,marge,Fictief,${dealerB}`,
      }),
    );
    assert.equal(staffImport.status, 403);

    const raw = await withTransaction({ userId: adminA.id, access: "authenticated" }, (client) =>
      client.query("SELECT id FROM vehicles"),
    );
    assert.deepEqual(
      raw.rows.map((row) => row.id),
      [vehicle.id],
    );

    const adminList = await handleAdminListStock(authRequest(platform.token));
    assert.equal(adminList.status, 200);
    const adminAsDealer = await handleAdminListStock(authRequest(adminA.token));
    assert.equal(adminAsDealer.status, 403);
    const noToken = await handleListStock(new Request("http://localhost/api/dealer/stock"));
    assert.equal(noToken.status, 401);
  });

  it("houdt voorraad bij een lege of deels foute CSV en maakt geen dubbels", async () => {
    const dealer = await createDealer("Import dealer");
    const admin = await createUser(dealer, "dealer_admin", "import@example.test");
    const actor = await actorFor(admin.token);
    const existing = await createOwnVehicle(actor, sample);
    await updateOwnVehicle(actor, existing.id, { publicationStatus: "published" });

    const empty = await importDealerCsv(actor, `${csvHeader}\n`);
    assert.equal(empty.status, "rejected");
    assert.equal((await listOwnStock(actor)).length, 1);

    const partial = await importDealerCsv(
      actor,
      `${csvHeader}\nKEEP-1,Testmerk,Testmodel,1.0,15000,2000,2021-02,benzine,manueel,hatchback,70,2000,Antwerpen,marge,Fictief,andere-dealer\nBAD-1,Testmerk,Testmodel,1.0,0,10,2021-02,waterstof,manueel,hatchback,70,2000,Antwerpen,marge,Fout,${dealer}`,
    );
    assert.equal(partial.status, "applied");
    assert.equal(partial.applied, 1);
    assert.equal(partial.invalid, 1);
    const afterPartial = await listOwnStock(actor);
    assert.equal(afterPartial.length, 2);
    assert.equal(afterPartial.find((vehicle) => vehicle.id === existing.id)?.publicationStatus, "published");
    assert.equal(afterPartial.find((vehicle) => vehicle.sourceStockId === "KEEP-1")?.dealerId, dealer);

    const again = await importDealerCsv(
      actor,
      `${csvHeader}\nKEEP-1,Testmerk,Testmodel,1.0,16000,2500,2021-02,benzine,manueel,hatchback,70,2000,Antwerpen,marge,Bijgewerkt,${dealer}`,
    );
    assert.equal(again.applied, 1);
    const afterAgain = await listOwnStock(actor);
    assert.equal(afterAgain.filter((vehicle) => vehicle.sourceStockId === "KEEP-1").length, 1);
    assert.equal(afterAgain.find((vehicle) => vehicle.sourceStockId === "KEEP-1")?.priceEur, 16000);
    assert.equal(afterAgain.find((vehicle) => vehicle.sourceStockId === "KEEP-1")?.publicationStatus, "draft");

    const rolled = await importDealerCsv(
      actor,
      `${csvHeader}\nROLL-1,Testmerk,Testmodel,1.0,17000,10,2021-03,benzine,manueel,hatchback,70,2000,Antwerpen,marge,Rollback,${dealer}`,
      { failBeforeCommit: true },
    );
    assert.equal(rolled.status, "rolled_back");
    assert.equal((await listOwnStock(actor)).some((vehicle) => vehicle.sourceStockId === "ROLL-1"), false);
    assert.equal((await listOwnStock(actor)).some((vehicle) => vehicle.id === existing.id), true);
  });

  it("haalt verkochte en fictieve auto's uit de publieke selectie", async () => {
    const dealer = await createDealer("Public dealer");
    const admin = await createUser(dealer, "dealer_admin", "public@example.test");
    const created = await handleCreateStock(jsonRequest(admin.token, sample));
    const vehicle = (await created.json()).vehicle as { id: string };
    const published = await handleUpdateStock(jsonRequest(admin.token, { publicationStatus: "published" }), vehicle.id);
    assert.equal(published.status, 200);
    assert.equal((await listPublishedVehicles()).some((item) => item.id === vehicle.id), false);
    await withService((client) => client.query("UPDATE app_settings SET value = 'false'::jsonb WHERE key = 'public_closed'"));
    assert.equal((await listPublishedVehicles()).some((item) => item.id === vehicle.id), true);

    const paused = await handleUpdateStock(jsonRequest(admin.token, { publicationStatus: "paused" }), vehicle.id);
    assert.equal(paused.status, 200);
    assert.equal((await listPublishedVehicles()).some((item) => item.id === vehicle.id), false);

    await handleUpdateStock(jsonRequest(admin.token, { publicationStatus: "published" }), vehicle.id);
    const sold = await handleUpdateStock(jsonRequest(admin.token, { publicationStatus: "sold" }), vehicle.id);
    assert.equal(sold.status, 200);
    assert.equal((await listPublishedVehicles()).some((item) => item.id === vehicle.id), false);
    const back = await handleUpdateStock(jsonRequest(admin.token, { publicationStatus: "published" }), vehicle.id);
    assert.equal(back.status, 422);

    await assert.rejects(
      withTransaction({ userId: admin.id, access: "authenticated" }, (client) =>
        client.query(
          `INSERT INTO vehicles (
             garage_id, source_system, source_stock_id, fictional, provenance, source_rights, publication_status,
             make, model, version, price_eur, mileage_km, first_registration, fuel, transmission, body, power_kw,
             postal_code, city, vat_regime, description
           ) VALUES (
             $1, 'dev-seed', 'fictional-1', true, 'dev-fictional-seed', 'dev-fictional', 'published',
             'Fictief', 'Model', 'Seed', 9000, 1000, '2020-01', 'benzine', 'manueel', 'hatchback', 60,
             '9000', 'Gent', 'marge', 'Fictieve ontwikkeldata'
           )`,
          [dealer],
        ),
      ),
    );
    const publishedIds = (await listPublishedVehicles()).map((item) => item.sourceStockId);
    assert.equal(publishedIds.includes("fictional-1"), false);
    await withService((client) => client.query("UPDATE app_settings SET value = 'true'::jsonb WHERE key = 'public_closed'"));
  });

  it("weigert overlappende reserveringen en laat een geannuleerde overlap toe", async () => {
    const dealer = await createDealer("Agenda dealer");
    const owner = await createUser(dealer, "dealer_admin", "agenda@example.test");
    const location = await withTransaction({ userId: owner.id, access: "authenticated" }, async (client) => {
      const place = await client.query<{ id: string }>(
        "INSERT INTO locations (garage_id, name) VALUES ($1, 'Vestiging test') RETURNING id",
        [dealer],
      );
      const resource = await client.query<{ id: string }>(
        `INSERT INTO bookable_resources (garage_id, location_id, kind, display_name)
         VALUES ($1, $2, 'staff', 'Medewerker test') RETURNING id`,
        [dealer, place.rows[0].id],
      );
      return { locationId: place.rows[0].id, resourceId: resource.rows[0].id };
    });

    await insertBooking(owner.id, dealer, location, "2026-11-10T09:00:00Z", 30, "confirmed", "0 minutes");
    await assert.rejects(
      insertBooking(owner.id, dealer, location, "2026-11-10T09:15:00Z", 30, "held", "0 minutes"),
      /overlap|exclusion|23P01/i,
    );
    await insertBooking(owner.id, dealer, location, "2026-11-10T09:15:00Z", 30, "cancelled", "0 minutes");
    await insertBooking(owner.id, dealer, location, "2026-11-10T09:30:00Z", 30, "confirmed", "0 minutes");
    await assert.rejects(
      insertBooking(owner.id, dealer, location, "2026-11-10T10:00:00Z", 30, "confirmed", "15 minutes"),
      /overlap|exclusion|23P01/i,
    );
  });

  it("bewaart een auto na een herstart van PostgreSQL", async () => {
    const dealer = await createDealer("Duurzaam");
    const admin = await createUser(dealer, "dealer_admin", "duurzaam@example.test");
    const actor = await actorFor(admin.token);
    const created = await createOwnVehicle(actor, sample);
    await closePool();
    await execFileAsync("sudo", ["pg_ctlcluster", "16", "main", "restart"]);
    const restored = await listOwnStock(actor);
    assert.equal(restored.some((vehicle) => vehicle.id === created.id), true);
  });
});

async function resetTables() {
  await withService((client) =>
    client.query(
      `TRUNCATE garage_claim_requests, professional_onboardings, vehicle_photos, import_job_rows, import_jobs,
        availability_bookings, location_opening_exceptions, location_opening_hours, bookable_resources, locations,
        vehicles, garage_members, garages, auth.local_sessions, auth.local_tokens, auth.users
       RESTART IDENTITY CASCADE`,
    ),
  );
  await reseedSettings("0");
}

async function reseedSettings(photoMin: string) {
  await withService((client) =>
    client.query(
      `INSERT INTO app_settings (key, value) VALUES
         ('public_closed', 'true'::jsonb),
         ('photo_min_to_publish', to_jsonb($1::int)),
         ('kbo_editable', 'false'::jsonb),
         ('sold_reversible', 'false'::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [Number(photoMin)],
    ),
  );
}

async function createDealer(name: string) {
  const result = await withService((client) =>
    client.query<{ id: string }>(
      "INSERT INTO garages (name, verification_status, is_public) VALUES ($1, 'verified', true) RETURNING id",
      [name],
    ),
  );
  return result.rows[0].id;
}

async function createUser(dealerId: string | null, role: "platform_admin" | "dealer_admin" | "dealer_staff", email: string) {
  const user = await withService((client) =>
    client.query<{ id: string }>(
      `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
       VALUES ($1, 'geen-login', now(), $2::jsonb) RETURNING id`,
      [email, JSON.stringify({ display_name: email })],
    ),
  );
  if (role === "platform_admin") {
    await withService((client) =>
      client.query("INSERT INTO platform_admins (user_id, note) VALUES ($1, 'testfixture')", [user.rows[0].id]),
    );
  }
  if (dealerId) {
    await withService((client) =>
      client.query("INSERT INTO garage_members (garage_id, user_id, role) VALUES ($1, $2, $3)", [
        dealerId,
        user.rows[0].id,
        role === "dealer_staff" ? "staff" : "owner",
      ]),
    );
  }
  const token = await insertLocalSession(user.rows[0].id);
  return { id: user.rows[0].id, token };
}

async function actorFor(token: string): Promise<Actor> {
  const { resolveActor } = await import("@/lib/dealer/auth");
  const actor = await resolveActor(token);
  if (!actor) throw new Error("sessie ontbreekt");
  return actor;
}

function authRequest(token: string) {
  return new Request("http://localhost/api/dealer/stock", { headers: { authorization: `Bearer ${token}` } });
}

function jsonRequest(token: string, body: unknown) {
  return new Request("http://localhost/api/dealer/stock", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function insertBooking(
  userId: string,
  dealerId: string,
  place: { locationId: string; resourceId: string },
  startsAt: string,
  durationMinutes: number,
  status: string,
  bufferBefore: string,
) {
  await withTransaction({ userId, access: "authenticated" }, (client) =>
    client.query(
      `INSERT INTO availability_bookings (
         garage_id, location_id, resource_id, status, starts_at, ends_at, buffer_before, duration_minutes
       ) VALUES (
         $1, $2, $3, $4, $5::timestamptz, $5::timestamptz + make_interval(mins => $6), $7::interval, $6
       )`,
      [dealerId, place.locationId, place.resourceId, status, startsAt, durationMinutes, bufferBefore],
    ),
  );
}
