import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { withService } from "@/lib/db/client";
import { insertLocalSession } from "@/lib/dealer/auth";
import { detectImage, addVehiclePhoto, PhotoValidationError, reorderVehiclePhotos } from "@/lib/dealer/photos";
import { createOwnVehicle, updateOwnVehicle, StockValidationError } from "@/lib/dealer/stock";
import type { Actor, StockInput } from "@/lib/dealer/types";
import { migrate } from "../../scripts/migrate";

const sample: StockInput = {
  make: "Audi",
  model: "A3",
  version: "1.0",
  priceEur: 15000,
  mileageKm: 1000,
  firstRegistration: "2021-01",
  fuel: "benzine",
  transmission: "manueel",
  body: "hatchback",
  powerKw: 81,
  postalCode: "2000",
  city: "Antwerpen",
  vatRegime: "marge",
  description: "Foto-test",
};

describe("fotoupload", () => {
  before(async () => {
    process.env.AUTH_MODE = "development-session";
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ontbreekt.");
    await migrate();
    await withService((client) =>
      client.query(
        `INSERT INTO app_settings (key, value) VALUES ('photo_min_to_publish', '3'::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ),
    );
  });

  it("weigert een nepbestand en een te groot bestand", async () => {
    assert.equal(detectImage(Buffer.from("geen-foto")), null);
    const garage = await createGarage();
    const owner = await createMember(garage, `foto-${Date.now()}@example.test`);
    const vehicle = await createOwnVehicle(owner, sample);
    await assert.rejects(addVehiclePhoto(owner, vehicle.id, Buffer.from("geen-foto")), PhotoValidationError);
    await assert.rejects(addVehiclePhoto(owner, vehicle.id, Buffer.alloc(5 * 1024 * 1024 + 1, 0xff)), PhotoValidationError);
  });

  it("eist drie foto's voor lancering en weigert een foto van een andere garage", async () => {
    const garage = await createGarage();
    const owner = await createMember(garage, `drie-${Date.now()}@example.test`);
    const other = await createMember(await createGarage(), `vreemd-${Date.now()}@example.test`);
    const vehicle = await createOwnVehicle(owner, sample);
    await assert.rejects(updateOwnVehicle(owner, vehicle.id, { publicationStatus: "published" }), StockValidationError);
    const first = await addVehiclePhoto(owner, vehicle.id, jpeg());
    const second = await addVehiclePhoto(owner, vehicle.id, jpeg());
    assert.equal(await addVehiclePhoto(other, vehicle.id, jpeg()), null);
    await addVehiclePhoto(owner, vehicle.id, jpeg());
    const published = await updateOwnVehicle(owner, vehicle.id, { publicationStatus: "published" });
    assert.equal(published?.publicationStatus, "published");
    assert.equal(await reorderVehiclePhotos(owner, vehicle.id, [second!.id, first!.id]), false);
  });
});

function jpeg() {
  return Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
}

async function createGarage() {
  const result = await withService((client) =>
    client.query<{ id: string }>(
      "INSERT INTO garages (name, verification_status, is_public) VALUES ('Fotogarage', 'verified', true) RETURNING id",
    ),
  );
  return result.rows[0].id;
}

async function createMember(garageId: string, email: string): Promise<Actor & { token: string }> {
  const user = await withService((client) =>
    client.query<{ id: string }>(
      `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
       VALUES ($1, 'geen-login', now(), '{"display_name":"Foto"}') RETURNING id`,
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
