import type { PoolClient } from "pg";
import { withTransaction } from "@/lib/db/client";
import { DealerAccessError, requireDealerActor } from "@/lib/dealer/auth";
import type { Actor, PublicationStatus, StockInput, VehicleRecord } from "@/lib/dealer/types";

const transitions: Record<PublicationStatus, readonly PublicationStatus[]> = {
  draft: ["published", "paused", "sold"],
  published: ["paused", "sold", "draft"],
  paused: ["published", "sold", "draft"],
  sold: [],
};

export class StockValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
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
  dealer_id: string;
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
};

function mapVehicle(row: VehicleRow): VehicleRecord {
  return {
    id: row.id,
    dealerId: row.dealer_id,
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
  };
}

const vehicleColumns = `id, dealer_id, source_system, source_stock_id, fictional, provenance, source_rights,
  publication_status, make, model, version, price_eur, mileage_km, first_registration, fuel, transmission,
  body, power_kw, postal_code, city, vat_regime, description`;

async function dealerContext<T>(actor: Actor, fn: (client: PoolClient, dealerId: string) => Promise<T>) {
  const dealer = requireDealerActor(actor);
  return withTransaction({ dealerId: dealer.dealerId, role: dealer.role, publicRead: false }, (client) =>
    fn(client, dealer.dealerId),
  );
}

export async function listOwnStock(actor: Actor) {
  return dealerContext(actor, async (client, dealerId) => {
    const result = await client.query<VehicleRow>(
      `SELECT ${vehicleColumns} FROM vehicles WHERE dealer_id = $1 ORDER BY created_at`,
      [dealerId],
    );
    return result.rows.map(mapVehicle);
  });
}

export async function createOwnVehicle(actor: Actor, input: StockInput) {
  const problems = publicationProblems(input);
  if (problems.length > 0) throw new StockValidationError(problems.join("; "));
  return dealerContext(actor, async (client, dealerId) => {
    const sourceStockId = crypto.randomUUID();
    const result = await client.query<VehicleRow>(
      `INSERT INTO vehicles (
         dealer_id, source_system, source_stock_id, fictional, provenance, source_rights, publication_status,
         make, model, version, price_eur, mileage_km, first_registration, fuel, transmission, body, power_kw,
         postal_code, city, vat_regime, description
       ) VALUES (
         $1, 'manual', $2, false, 'dealer-manual', 'dealer-owned', 'draft',
         $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
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
      ],
    );
    return mapVehicle(result.rows[0]);
  });
}

export async function updateOwnVehicle(
  actor: Actor,
  vehicleId: string,
  patch: Partial<StockInput> & { publicationStatus?: PublicationStatus },
) {
  return dealerContext(actor, async (client, dealerId) => {
    const current = await client.query<VehicleRow>(
      `SELECT ${vehicleColumns} FROM vehicles WHERE id = $1 AND dealer_id = $2`,
      [vehicleId, dealerId],
    );
    const row = current.rows[0];
    if (!row) return null;
    const nextStatus = patch.publicationStatus ?? row.publication_status;
    if (patch.publicationStatus && !canTransition(row.publication_status, patch.publicationStatus)) {
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
    }
    const updated = await client.query<VehicleRow>(
      `UPDATE vehicles SET
         publication_status = $3, make = $4, model = $5, version = $6, price_eur = $7, mileage_km = $8,
         first_registration = $9, fuel = $10, transmission = $11, body = $12, power_kw = $13,
         postal_code = $14, city = $15, vat_regime = $16, description = $17, updated_at = now()
       WHERE id = $1 AND dealer_id = $2
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
      ],
    );
    return mapVehicle(updated.rows[0]);
  });
}

export async function listPublishedVehicles() {
  return withTransaction({ dealerId: null, role: "public", publicRead: true }, async (client) => {
    const result = await client.query<VehicleRow>(
      `SELECT ${vehicleColumns} FROM vehicles
       WHERE publication_status = 'published' AND fictional = false
       ORDER BY price_eur, id`,
    );
    return result.rows.map(mapVehicle);
  });
}

export async function listAllStockAsAdmin(actor: Actor) {
  if (actor.role !== "platform_admin") throw new DealerAccessError("forbidden");
  return withTransaction({ dealerId: null, role: "platform_admin", publicRead: false }, async (client) => {
    const result = await client.query<VehicleRow>(`SELECT ${vehicleColumns} FROM vehicles ORDER BY dealer_id, id`);
    return result.rows.map(mapVehicle);
  });
}

export function isDealerAccessError(error: unknown): error is DealerAccessError {
  return error instanceof DealerAccessError;
}
