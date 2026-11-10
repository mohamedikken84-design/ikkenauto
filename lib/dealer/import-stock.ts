import type { PoolClient } from "pg";
import { withTransaction } from "@/lib/db/client";
import { actorAccess, requireDealerAdmin } from "@/lib/dealer/auth";
import { parseStockCsv, type StockCsvRow } from "@/lib/dealer/stock-csv";
import type { Actor } from "@/lib/dealer/types";

export type ImportResult = {
  status: "applied" | "rejected" | "rolled_back";
  batchId: string;
  applied: number;
  invalid: number;
  rows: { lineNumber: number; sourceStockId: string; status: string; errors: string[] }[];
};

async function insertBatch(client: PoolClient, dealerId: string, userId: string, status: ImportResult["status"]) {
  const result = await client.query<{ id: string }>(
    `INSERT INTO import_jobs (garage_id, source_system, status, created_by)
     VALUES ($1, 'csv', $2, $3) RETURNING id`,
    [dealerId, status, userId],
  );
  return result.rows[0].id;
}

async function recordRow(client: PoolClient, batchId: string, dealerId: string, row: StockCsvRow, status: string) {
  await client.query(
    `INSERT INTO import_job_rows (job_id, garage_id, line_number, source_stock_id, status, errors)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [batchId, dealerId, row.lineNumber, row.sourceStockId, status, row.errors.join("; ")],
  );
}

async function upsertRow(client: PoolClient, dealerId: string, batchId: string, row: StockCsvRow) {
  await client.query(
    `INSERT INTO vehicles (
       garage_id, source_system, source_stock_id, fictional, provenance, source_rights, publication_status,
       make, model, version, price_eur, mileage_km, first_registration, fuel, transmission, body, power_kw,
       postal_code, city, vat_regime, description, import_job_id
     ) VALUES (
       $1, 'csv', $2, false, 'csv-import', 'imported-by-dealer', 'draft',
       $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
     )
     ON CONFLICT (garage_id, source_system, source_stock_id) DO UPDATE SET
       make = EXCLUDED.make,
       model = EXCLUDED.model,
       version = EXCLUDED.version,
       price_eur = EXCLUDED.price_eur,
       mileage_km = EXCLUDED.mileage_km,
       first_registration = EXCLUDED.first_registration,
       fuel = EXCLUDED.fuel,
       transmission = EXCLUDED.transmission,
       body = EXCLUDED.body,
       power_kw = EXCLUDED.power_kw,
       postal_code = EXCLUDED.postal_code,
       city = EXCLUDED.city,
       vat_regime = EXCLUDED.vat_regime,
       description = EXCLUDED.description,
       import_job_id = EXCLUDED.import_job_id,
       updated_at = now()`,
    [
      dealerId,
      row.sourceStockId,
      row.make,
      row.model,
      row.version,
      row.priceEur,
      row.mileageKm,
      row.firstRegistration,
      row.fuel,
      row.transmission,
      row.body,
      row.powerKw,
      row.postalCode,
      row.city,
      row.vatRegime,
      row.description,
      batchId,
    ],
  );
}

export async function previewDealerCsv(actor: Actor, csv: string) {
  const dealer = requireDealerAdmin(actor);
  const parsed = parseStockCsv(csv);
  if (parsed.fatal) return { fatal: parsed.fatal, rows: [] as PreviewRow[], vehicleCount: await countOwn(actor) };
  const existing = await withTransaction(actorAccess(dealer), (client) =>
    client.query<{ source_stock_id: string }>(
      "SELECT source_stock_id FROM vehicles WHERE garage_id = $1 AND source_system = 'csv'",
      [dealer.dealerId],
    ),
  );
  const known = new Set(existing.rows.map((row) => row.source_stock_id));
  return {
    fatal: null,
    vehicleCount: await countOwn(actor),
    rows: parsed.rows.map((row) => ({
      lineNumber: row.lineNumber,
      sourceStockId: row.sourceStockId,
      make: row.make,
      model: row.model,
      priceEur: row.priceEur,
      status: row.errors.length > 0 ? "invalid" : known.has(row.sourceStockId) ? "update" : "new",
      errors: row.errors,
    })),
  };
}

type PreviewRow = {
  lineNumber: number;
  sourceStockId: string;
  make: string;
  model: string;
  priceEur: number;
  status: string;
  errors: string[];
};

async function countOwn(actor: Actor) {
  const { listOwnStock } = await import("@/lib/dealer/stock");
  return (await listOwnStock(actor)).length;
}

export async function importDealerCsv(
  actor: Actor,
  csv: string,
  options?: { failBeforeCommit?: boolean },
): Promise<ImportResult> {
  const dealer = requireDealerAdmin(actor);
  const parsed = parseStockCsv(csv);
  if (parsed.fatal) {
    const batchId = await withTransaction(
      actorAccess(dealer),
      (client) => insertBatch(client, dealer.dealerId, dealer.userId, "rejected"),
    );
    return { status: "rejected", batchId, applied: 0, invalid: 0, rows: [] };
  }

  try {
    return await withTransaction(actorAccess(dealer), async (client) => {
      const batchId = await insertBatch(client, dealer.dealerId, dealer.userId, "applied");
      let applied = 0;
      let invalid = 0;
      const rows: ImportResult["rows"] = [];
      for (const row of parsed.rows) {
        if (row.errors.length > 0) {
          invalid += 1;
          await recordRow(client, batchId, dealer.dealerId, row, "invalid");
          rows.push({ lineNumber: row.lineNumber, sourceStockId: row.sourceStockId, status: "invalid", errors: row.errors });
          continue;
        }
        await upsertRow(client, dealer.dealerId, batchId, row);
        applied += 1;
        await recordRow(client, batchId, dealer.dealerId, row, "applied");
        rows.push({ lineNumber: row.lineNumber, sourceStockId: row.sourceStockId, status: "applied", errors: [] });
      }
      if (options?.failBeforeCommit) throw new Error("test-rollback");
      return { status: "applied" as const, batchId, applied, invalid, rows };
    });
  } catch (error) {
    if (!options?.failBeforeCommit) throw error;
    const batchId = await withTransaction(
      actorAccess(dealer),
      (client) => insertBatch(client, dealer.dealerId, dealer.userId, "rolled_back"),
    );
    return { status: "rolled_back", batchId, applied: 0, invalid: 0, rows: [] };
  }
}
