import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { withService } from "@/lib/db/client";
import { previewDealerCsv, importDealerCsv } from "@/lib/dealer/import-stock";
import { parseStockCsv } from "@/lib/dealer/stock-csv";
import type { Actor } from "@/lib/dealer/types";
import { migrate } from "../../scripts/migrate";

const header =
  "source_stock_id,make,model,version,price_eur,mileage_km,first_registration,fuel,transmission,body,power_kw,postal_code,city,vat_regime,description";

describe("csv-voorvertoning", () => {
  before(async () => {
    process.env.AUTH_MODE = "development-session";
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ontbreekt.");
    await migrate();
  });

  it("leest een Belgische puntkomma en schrijft niets in de voorvertoning", async () => {
    const parsed = parseStockCsv(
      `${header.replaceAll(",", ";")}\nPREVIEW-1;Volkswagen;Golf;Life;18000;1000;2020-03;benzine;manueel;hatchback;110;2000;Antwerpen;marge;Demo`,
    );
    assert.equal(parsed.fatal, null);
    assert.equal(parsed.rows[0]?.sourceStockId, "PREVIEW-1");

    const garage = await createGarage();
    const owner = await createMember(garage, `csv-${Date.now()}@example.test`);
    const preview = await previewDealerCsv(owner, `${header}\nPREVIEW-1,Volkswagen,Golf,Life,18000,1000,2020-03,benzine,manueel,hatchback,110,2000,Antwerpen,marge,Demo`);
    assert.equal(preview.fatal, null);
    assert.equal(preview.rows[0]?.status, "new");
    assert.equal(preview.vehicleCount, 0);
    const applied = await importDealerCsv(owner, `${header}\nPREVIEW-1,Volkswagen,Golf,Life,18000,1000,2020-03,benzine,manueel,hatchback,110,2000,Antwerpen,marge,Demo`);
    assert.equal(applied.applied, 1);
    const again = await previewDealerCsv(owner, `${header}\nPREVIEW-1,Volkswagen,Golf,Life,19000,1000,2020-03,benzine,manueel,hatchback,110,2000,Antwerpen,marge,Demo`);
    assert.equal(again.rows[0]?.status, "update");
    assert.equal(again.vehicleCount, 1);
  });
});

async function createGarage() {
  const result = await withService((client) =>
    client.query<{ id: string }>("INSERT INTO garages (name, verification_status, is_public) VALUES ('Importgarage', 'verified', false) RETURNING id"),
  );
  return result.rows[0].id;
}

async function createMember(garageId: string, email: string): Promise<Actor> {
  const user = await withService((client) =>
    client.query<{ id: string }>(
      `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
       VALUES ($1, 'geen-login', now(), '{"display_name":"Import"}') RETURNING id`,
      [email],
    ),
  );
  await withService((client) =>
    client.query("INSERT INTO garage_members (garage_id, user_id, role) VALUES ($1, $2, 'owner')", [garageId, user.rows[0].id]),
  );
  return { userId: user.rows[0].id, role: "dealer_admin", dealerId: garageId, email };
}
