import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PoolClient } from "pg";
import { withService } from "@/lib/db/client";
import { requireDealerActor } from "@/lib/dealer/auth";
import { dealerContext } from "@/lib/dealer/stock";
import type { Actor } from "@/lib/dealer/types";

const maxBytes = 5 * 1024 * 1024;

export function detectImage(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

function extension(mime: "image/jpeg" | "image/png" | "image/webp") {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function photoCap() {
  const result = await withService((client) =>
    client.query<{ value: number }>("SELECT value FROM app_settings WHERE key = 'photo_max_count'"),
  );
  const value = result.rows[0]?.value;
  const requested = typeof value === "number" ? value : 20;
  return Math.min(Math.max(requested, 1), 20);
}

export async function addVehiclePhoto(actor: Actor, vehicleId: string, bytes: Buffer) {
  const dealer = requireDealerActor(actor);
  if (bytes.length < 1 || bytes.length > maxBytes) {
    throw new PhotoValidationError("Een foto mag hoogstens 5 MB zijn.");
  }
  const mime = detectImage(bytes);
  if (!mime) throw new PhotoValidationError("Alleen JPG, PNG of WebP.");
  const cap = await photoCap();
  return dealerContext(actor, async (client) => {
    const vehicle = await client.query("SELECT id FROM vehicles WHERE id = $1 AND garage_id = $2 AND deleted_at IS NULL", [
      vehicleId,
      dealer.dealerId,
    ]);
    if (!vehicle.rows[0]) return null;
    const count = await client.query<{ count: string }>("SELECT count(*)::text AS count FROM vehicle_photos WHERE vehicle_id = $1", [
      vehicleId,
    ]);
    if (Number(count.rows[0].count) >= cap) throw new PhotoValidationError("U kunt maximaal 20 foto's toevoegen.");
    const file = `${crypto.randomUUID()}.${extension(mime)}`;
    const storagePath = `${dealer.dealerId}/${vehicleId}/${file}`;
    const sort = Number(count.rows[0].count);
    await client.query(
      `INSERT INTO storage.objects (bucket_id, name) VALUES ('vehicle-photos', $1)`,
      [storagePath],
    );
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO vehicle_photos (vehicle_id, garage_id, storage_path, sort_order, is_cover, mime_type, byte_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [vehicleId, dealer.dealerId, storagePath, sort, sort === 0, mime, bytes.length],
    );
    await storeLocally(storagePath, bytes);
    return { id: inserted.rows[0].id, storagePath, mime };
  });
}

export async function reorderVehiclePhotos(actor: Actor, vehicleId: string, orderedIds: string[]) {
  const dealer = requireDealerActor(actor);
  return dealerContext(actor, async (client) => {
    const rows = await client.query<{ id: string }>(
      "SELECT id FROM vehicle_photos WHERE vehicle_id = $1 AND garage_id = $2 ORDER BY sort_order",
      [vehicleId, dealer.dealerId],
    );
    const known = new Set(rows.rows.map((row) => row.id));
    if (orderedIds.length !== known.size || orderedIds.some((id) => !known.has(id))) return false;
    for (const [index, id] of orderedIds.entries()) {
      await client.query("UPDATE vehicle_photos SET sort_order = $2, is_cover = $3 WHERE id = $1", [id, index, index === 0]);
    }
    return true;
  });
}

async function storeLocally(storagePath: string, bytes: Buffer) {
  const target = path.join(process.cwd(), "data", "local-photos", storagePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

export class PhotoValidationError extends Error {}

export function isPhotoError(error: unknown): error is PhotoValidationError {
  return error instanceof PhotoValidationError;
}

export async function countPhotos(client: PoolClient, vehicleId: string) {
  const result = await client.query<{ count: string }>("SELECT count(*)::text AS count FROM vehicle_photos WHERE vehicle_id = $1", [
    vehicleId,
  ]);
  return Number(result.rows[0].count);
}
