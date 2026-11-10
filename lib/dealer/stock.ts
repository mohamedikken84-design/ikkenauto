import type { PoolClient } from "pg";
import { withService, withTransaction } from "@/lib/db/client";
import { actorAccess, DealerAccessError, requireDealerActor } from "@/lib/dealer/auth";
import type { Actor, PublicationStatus, StockInput, VehicleRecord } from "@/lib/dealer/types";

const transitions: Record<PublicationStatus, readonly PublicationStatus[]> = {
  draft: ["published", "paused", "sold", "archived"],
  published: ["paused", "sold", "draft", "archived"],
  paused: ["published", "sold", "draft", "archived"],
  archived: ["draft"],
  sold: [],
};

export class StockValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

async function photoMinimum() {
  const result = await withService((client) =>
    client.query<{ value: number }>("SELECT value AS value FROM app_settings WHERE key = 'photo_min_to_publish'"),
  );
  const value = result.rows[0]?.value;
  return typeof value === "number" ? value : 3;
}

async function soldIsReversible() {
  const result = await withService((client) =>
    client.query<{ value: boolean }>("SELECT value AS value FROM app_settings WHERE key = 'sold_reversible'"),
  );
  return result.rows[0]?.value === true;
}

export function canTransition(from: PublicationStatus, to: PublicationStatus) {
  return transitions[from].includes(to);
}

export function publicationProblems(input: StockInput) {
  const problems: string[] = [];
  if (!input.make.trim() || !input.model.trim() || !input.city.trim()) problems.push("merk, model en plaats zijn verplicht");
  if (!Number.isInteger(input.priceEur) || input.priceEur <= 0) problems.push("prijs moet een positief geheel getal zijn");
  if (!Number.isInteger(input.mileageKm) || input.mileageKm < 0) problems.push("kilometerstand is ongeldig");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.firstRegistration)) problems.push("eerste inschrijving moet YYYY-MM zijn");
  if (!/^\d{4}$/.test(input.postalCode)) problems.push("postcode moet 4 cijfers zijn");
  return problems;
}

type VehicleRow = {
  id: string;
  garage_id: string;
  source_system: string;
  source_stock_id: string;
  fictional: boolean;
  provenance: string;
  source_rights: VehicleRecord["sourceRights"];
  publication_status: PublicationStatus;
  make: string;
  model: string;
  version: string;
  price_eur: number;
  mileage_km: number;
  first_registration: string;
  fuel: string;
  transmission: string;
  body: string;
  power_kw: number;
  postal_code: string;
  city: string;
  vat_regime: string;
  description: string;
  color: string | null;
  doors: number | null;
  seats: number | null;
  co2_gkm: number | null;
  euro_norm: string | null;
  equipment: string[] | null;
  vat_deductible: boolean;
  warranty_months: number | null;
  inspection_valid_until: string | null;
  previous_owners: number | null;
  description_nl: string | null;
  description_fr: string | null;
};

function mapVehicle(row: VehicleRow): VehicleRecord {
  return {
    id: row.id,
    dealerId: row.garage_id,
    sourceSystem: row.source_system,
    sourceStockId: row.source_stock_id,
    fictional: row.fictional,
    provenance: row.provenance,
    sourceRights: row.source_rights,
    publicationStatus: row.publication_status,
    make: row.make,
    model: row.model,
    version: row.version,
    priceEur: row.price_eur,
    mileageKm: row.mileage_km,
    firstRegistration: row.first_registration,
    fuel: row.fuel,
    transmission: row.transmission,
    body: row.body,
    powerKw: row.power_kw,
    postalCode: row.postal_code,
    city: row.city,
    vatRegime: row.vat_regime,
    description: row.description,
    color: row.color,
    doors: row.doors,
    seats: row.seats,
    co2Gkm: row.co2_gkm,
    euroNorm: row.euro_norm,
    equipment: row.equipment ?? [],
    vatDeductible: Boolean(row.vat_deductible),
    warrantyMonths: row.warranty_months,
    inspectionValidUntil: row.inspection_valid_until,
    previousOwners: row.previous_owners,
    descriptionNl: row.description_nl,
    descriptionFr: row.description_fr,
  };
}

const vehicleColumns = `id, garage_id, source_system, source_stock_id, fictional, provenance, source_rights,
  publication_status, make, model, version, price_eur, mileage_km, first_registration, fuel, transmission,
  body, power_kw, postal_code, city, vat_regime, description, color, doors, seats, co2_gkm, euro_norm,
  equipment, vat_deductible, warranty_months, inspection_valid_until::text AS inspection_valid_until,
  previous_owners, description_nl, description_fr`;

export async function dealerContext<T>(actor: Actor, fn: (client: PoolClient, dealerId: string) => Promise<T>) {
  const dealer = requireDealerActor(actor);
  return withTransaction(actorAccess(actor), (client) => fn(client, dealer.dealerId));
}

export async function listOwnStock(actor: Actor) {
  return dealerContext(actor, async (client, dealerId) => {
    const result = await client.query<VehicleRow>(
      `SELECT ${vehicleColumns} FROM vehicles WHERE garage_id = $1 AND deleted_at IS NULL ORDER BY created_at`,
      [dealerId],
    );
    return result.rows.map(mapVehicle);
  });
}

function cleanPlate(value: string | null | undefined) {
  if (value == null || value.trim() === "") return null;
  const plate = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{2,12}$/.test(plate)) {
    throw new StockValidationError("Het kenteken mag alleen letters en cijfers bevatten, 2 tot 12 tekens.");
  }
  return plate;
}

function cleanVin(value: string | null | undefined) {
  if (value == null || value.trim() === "") return null;
  const vin = value.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin)) {
    throw new StockValidationError("Het VIN moet 11 tot 17 tekens zijn, zonder I, O of Q.");
  }
  return vin;
}

function listingValues(input: StockInput) {
  const doors = input.doors ?? null;
  const seats = input.seats ?? null;
  const co2 = input.co2Gkm ?? null;
  const warranty = input.warrantyMonths ?? null;
  const owners = input.previousOwners ?? null;
  if (doors != null && (!Number.isInteger(doors) || doors < 2 || doors > 6)) {
    throw new StockValidationError("Het aantal deuren moet tussen 2 en 6 liggen.");
  }
  if (seats != null && (!Number.isInteger(seats) || seats < 1 || seats > 9)) {
    throw new StockValidationError("Het aantal zitplaatsen moet tussen 1 en 9 liggen.");
  }
  if (co2 != null && (!Number.isInteger(co2) || co2 < 0 || co2 > 999)) {
    throw new StockValidationError("CO2 moet tussen 0 en 999 g/km liggen.");
  }
  if (warranty != null && (!Number.isInteger(warranty) || warranty < 0 || warranty > 120)) {
    throw new StockValidationError("Garantie moet tussen 0 en 120 maanden liggen.");
  }
  if (owners != null && (!Number.isInteger(owners) || owners < 0)) {
    throw new StockValidationError("Het aantal vorige eigenaars moet 0 of meer zijn.");
  }
  return {
    color: input.color?.trim() || null,
    doors,
    seats,
    co2,
    euroNorm: input.euroNorm?.trim() || null,
    equipment: input.equipment ?? [],
    warranty,
    inspection: input.inspectionValidUntil?.trim() || null,
    owners,
    descriptionNl: input.descriptionNl?.trim() || null,
    descriptionFr: input.descriptionFr?.trim() || null,
    vin: cleanVin(input.vin),
    plate: cleanPlate(input.licensePlate),
  };
}

async function writePrivate(
  client: PoolClient,
  vehicleId: string,
  garageId: string,
  vin: string | null | undefined,
  plate: string | null | undefined,
) {
  if (vin === undefined && plate === undefined) return;
  await client.query(
    `INSERT INTO vehicle_private (vehicle_id, garage_id, vin, license_plate)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (vehicle_id) DO UPDATE SET
       vin = COALESCE($3, vehicle_private.vin),
       license_plate = COALESCE($4, vehicle_private.license_plate)`,
    [vehicleId, garageId, vin ?? null, plate ?? null],
  );
}

export async function createOwnVehicle(actor: Actor, input: StockInput) {
  const problems = publicationProblems(input);
  if (problems.length > 0) throw new StockValidationError(problems.join("; "));
  const extra = listingValues(input);
  return dealerContext(actor, async (client, dealerId) => {
    const sourceStockId = input.sourceStockId?.trim() || crypto.randomUUID();
    const result = await client.query<VehicleRow>(
      `INSERT INTO vehicles (
         garage_id, source_system, source_stock_id, fictional, provenance, source_rights, publication_status,
         make, model, version, price_eur, mileage_km, first_registration, fuel, transmission, body, power_kw,
         postal_code, city, vat_regime, description, color, doors, seats, co2_gkm, euro_norm, equipment,
         warranty_months, inspection_valid_until, previous_owners, description_nl, description_fr, updated_by
       ) VALUES (
         $1, 'manual', $2, false, 'dealer-manual', 'dealer-owned', 'draft',
         $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
         $17, $18, $19, $20, $21, $22::jsonb, $23, $24, $25, $26, $27, $28
       ) RETURNING ${vehicleColumns}`,
      [
        dealerId,
        sourceStockId,
        input.make.trim(),
        input.model.trim(),
        input.version.trim(),
        input.priceEur,
        input.mileageKm,
        input.firstRegistration,
        input.fuel,
        input.transmission,
        input.body,
        input.powerKw,
        input.postalCode,
        input.city.trim(),
        input.vatRegime,
        input.description.trim(),
        extra.color,
        extra.doors,
        extra.seats,
        extra.co2,
        extra.euroNorm,
        JSON.stringify(extra.equipment),
        extra.warranty,
        extra.inspection,
        extra.owners,
        extra.descriptionNl,
        extra.descriptionFr,
        actor.userId,
      ],
    );
    const vehicle = mapVehicle(result.rows[0]);
    await writePrivate(client, vehicle.id, dealerId, extra.vin, extra.plate);
    return vehicle;
  });
}

export async function updateOwnVehicle(
  actor: Actor,
  vehicleId: string,
  patch: Partial<StockInput> & { publicationStatus?: PublicationStatus },
) {
  return dealerContext(actor, async (client, dealerId) => {
    const current = await client.query<VehicleRow>(
      `SELECT ${vehicleColumns} FROM vehicles WHERE id = $1 AND garage_id = $2`,
      [vehicleId, dealerId],
    );
    const row = current.rows[0];
    if (!row) return null;
    const nextStatus = patch.publicationStatus ?? row.publication_status;
    if (patch.publicationStatus && row.publication_status === "sold" && patch.publicationStatus !== "sold") {
      const reversible = await soldIsReversible();
      if (!reversible || patch.publicationStatus !== "draft") {
        throw new StockValidationError("Een verkochte auto kan niet van status veranderen.");
      }
    } else if (patch.publicationStatus && !canTransition(row.publication_status, patch.publicationStatus)) {
      throw new StockValidationError(`status ${row.publication_status} kan niet naar ${patch.publicationStatus}`);
    }
    const next: StockInput = {
      make: patch.make ?? row.make,
      model: patch.model ?? row.model,
      version: patch.version ?? row.version,
      priceEur: patch.priceEur ?? row.price_eur,
      mileageKm: patch.mileageKm ?? row.mileage_km,
      firstRegistration: patch.firstRegistration ?? row.first_registration,
      fuel: patch.fuel ?? row.fuel,
      transmission: patch.transmission ?? row.transmission,
      body: patch.body ?? row.body,
      powerKw: patch.powerKw ?? row.power_kw,
      postalCode: patch.postalCode ?? row.postal_code,
      city: patch.city ?? row.city,
      vatRegime: patch.vatRegime ?? row.vat_regime,
      description: patch.description ?? row.description,
    };
    if (nextStatus === "published") {
      const problems = publicationProblems(next);
      if (problems.length > 0) throw new StockValidationError(problems.join("; "));
      const dealer = await client.query<{ verification_status: string; is_public: boolean }>(
        "SELECT verification_status, is_public FROM garages WHERE id = $1",
        [dealerId],
      );
      if (dealer.rows[0]?.verification_status !== "verified") {
        throw new StockValidationError("Een niet-geverifieerde garage kan niet publiceren.");
      }
      if (!dealer.rows[0]?.is_public) {
        throw new StockValidationError("Publiceer eerst uw garagepagina. De auto blijft een concept.");
      }
      const minimum = await photoMinimum();
      if (minimum > 0) {
        const photos = await client.query<{ count: string }>(
          "SELECT count(*)::text AS count FROM vehicle_photos WHERE vehicle_id = $1",
          [vehicleId],
        );
        if (Number(photos.rows[0]?.count ?? 0) < minimum) {
          throw new StockValidationError(`Voeg minstens ${minimum} foto's toe voor u de auto klaarzet voor de lancering.`);
        }
      }
    }
    const extra = listingValues({
      ...next,
      color: patch.color !== undefined ? patch.color : row.color,
      doors: patch.doors !== undefined ? patch.doors : row.doors,
      seats: patch.seats !== undefined ? patch.seats : row.seats,
      co2Gkm: patch.co2Gkm !== undefined ? patch.co2Gkm : row.co2_gkm,
      euroNorm: patch.euroNorm !== undefined ? patch.euroNorm : row.euro_norm,
      equipment: patch.equipment !== undefined ? patch.equipment : (row.equipment ?? []),
      warrantyMonths: patch.warrantyMonths !== undefined ? patch.warrantyMonths : row.warranty_months,
      inspectionValidUntil: patch.inspectionValidUntil !== undefined ? patch.inspectionValidUntil : row.inspection_valid_until,
      previousOwners: patch.previousOwners !== undefined ? patch.previousOwners : row.previous_owners,
      descriptionNl: patch.descriptionNl !== undefined ? patch.descriptionNl : row.description_nl,
      descriptionFr: patch.descriptionFr !== undefined ? patch.descriptionFr : row.description_fr,
    });
    const updated = await client.query<VehicleRow>(
      `UPDATE vehicles SET
         publication_status = $3, make = $4, model = $5, version = $6, price_eur = $7, mileage_km = $8,
         first_registration = $9, fuel = $10, transmission = $11, body = $12, power_kw = $13,
         postal_code = $14, city = $15, vat_regime = $16, description = $17,
         color = $18, doors = $19, seats = $20, co2_gkm = $21, euro_norm = $22, equipment = $23::jsonb,
         warranty_months = $24, inspection_valid_until = $25, previous_owners = $26,
         description_nl = $27, description_fr = $28, updated_by = $29, updated_at = now()
       WHERE id = $1 AND garage_id = $2
       RETURNING ${vehicleColumns}`,
      [
        vehicleId,
        dealerId,
        nextStatus,
        next.make,
        next.model,
        next.version,
        next.priceEur,
        next.mileageKm,
        next.firstRegistration,
        next.fuel,
        next.transmission,
        next.body,
        next.powerKw,
        next.postalCode,
        next.city,
        next.vatRegime,
        next.description,
        extra.color,
        extra.doors,
        extra.seats,
        extra.co2,
        extra.euroNorm,
        JSON.stringify(extra.equipment),
        extra.warranty,
        extra.inspection,
        extra.owners,
        extra.descriptionNl,
        extra.descriptionFr,
        actor.userId,
      ],
    );
    if (patch.vin !== undefined || patch.licensePlate !== undefined) {
      await writePrivate(
        client,
        vehicleId,
        dealerId,
        patch.vin !== undefined ? extra.vin : undefined,
        patch.licensePlate !== undefined ? extra.plate : undefined,
      );
    }
    await client.query(
      `INSERT INTO audit_log (garage_id, actor_id, action, entity_type, entity_id, diff)
       VALUES ($1, $2, 'vehicle.update', 'vehicle', $3, $4::jsonb)`,
      [
        dealerId,
        actor.userId,
        vehicleId,
        JSON.stringify({
          publicationStatus: nextStatus,
          priceEur: next.priceEur,
          color: extra.color,
        }),
      ],
    );
    return mapVehicle(updated.rows[0]);
  });
}

export async function deleteOwnVehicle(actor: Actor, vehicleId: string) {
  return dealerContext(actor, async (client, dealerId) => {
    const current = await client.query<{ publication_status: string }>(
      "SELECT publication_status FROM vehicles WHERE id = $1 AND garage_id = $2 AND deleted_at IS NULL",
      [vehicleId, dealerId],
    );
    const row = current.rows[0];
    if (!row) return false;
    if (row.publication_status === "sold") {
      throw new StockValidationError("Een verkochte auto kan niet worden verwijderd.");
    }
    await client.query(
      "UPDATE vehicles SET deleted_at = now(), updated_by = $3, updated_at = now() WHERE id = $1 AND garage_id = $2",
      [vehicleId, dealerId, actor.userId],
    );
    await client.query(
      `INSERT INTO audit_log (garage_id, actor_id, action, entity_type, entity_id, diff)
       VALUES ($1, $2, 'vehicle.delete', 'vehicle', $3, '{"deleted":true}'::jsonb)`,
      [dealerId, actor.userId, vehicleId],
    );
    return true;
  });
}

export async function getOwnVehicle(actor: Actor, vehicleId: string) {
  return dealerContext(actor, async (client, dealerId) => {
    const result = await client.query<VehicleRow>(
      `SELECT ${vehicleColumns} FROM vehicles WHERE id = $1 AND garage_id = $2 AND deleted_at IS NULL`,
      [vehicleId, dealerId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const secret = await client.query<{ vin: string | null; license_plate: string | null }>(
      "SELECT vin, license_plate FROM vehicle_private WHERE vehicle_id = $1",
      [vehicleId],
    );
    return {
      ...mapVehicle(row),
      vin: secret.rows[0]?.vin ?? null,
      licensePlate: secret.rows[0]?.license_plate ?? null,
    };
  });
}

export async function listPublishedVehicles() {
  return withTransaction({ userId: null, access: "anon" }, async (client) => {
    const result = await client.query<VehicleRow>(
      `SELECT ${vehicleColumns} FROM vehicles
       WHERE publication_status = 'published' AND fictional = false AND deleted_at IS NULL
         AND EXISTS (
           SELECT 1 FROM garages d
           WHERE d.id = vehicles.garage_id AND d.verification_status = 'verified' AND d.is_public AND d.deleted_at IS NULL
         )
       ORDER BY price_eur, id`,
    );
    return result.rows.map(mapVehicle);
  });
}

export async function listAllStockAsAdmin(actor: Actor) {
  if (actor.role !== "platform_admin") throw new DealerAccessError("forbidden");
  return withTransaction(actorAccess(actor), async (client) => {
    const result = await client.query<VehicleRow>(`SELECT ${vehicleColumns} FROM vehicles ORDER BY garage_id, id`);
    return result.rows.map(mapVehicle);
  });
}

export function isDealerAccessError(error: unknown): error is DealerAccessError {
  return error instanceof DealerAccessError;
}
