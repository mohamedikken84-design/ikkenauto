import { AuthConfigError, DealerAccessError, requireDealerActor, resolveActor } from "@/lib/dealer/auth";
import { readAnySessionToken } from "@/lib/dealer/auth-http";
import { importDealerCsv } from "@/lib/dealer/import-stock";
import { createOwnVehicle, isDealerAccessError, listAllStockAsAdmin, listOwnStock, StockValidationError, updateOwnVehicle } from "@/lib/dealer/stock";
import { publicationStatuses, type PublicationStatus, type StockInput } from "@/lib/dealer/types";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

async function actorFrom(request: Request) {
  try {
    const actor = await resolveActor(readAnySessionToken(request));
    if (!actor) return json({ error: "unauthorized" }, 401);
    return actor;
  } catch (error) {
    if (error instanceof AuthConfigError) return json({ error: "auth-not-configured" }, 503);
    throw error;
  }
}

function isActor(value: Awaited<ReturnType<typeof actorFrom>>): value is Exclude<Awaited<ReturnType<typeof actorFrom>>, Response> {
  return !(value instanceof Response);
}

function readStockInput(value: Record<string, unknown>): StockInput {
  return {
    make: String(value.make ?? ""),
    model: String(value.model ?? ""),
    version: String(value.version ?? ""),
    priceEur: Number(value.priceEur),
    mileageKm: Number(value.mileageKm),
    firstRegistration: String(value.firstRegistration ?? ""),
    fuel: String(value.fuel ?? ""),
    transmission: String(value.transmission ?? ""),
    body: String(value.body ?? ""),
    powerKw: Number(value.powerKw),
    postalCode: String(value.postalCode ?? ""),
    city: String(value.city ?? ""),
    vatRegime: String(value.vatRegime ?? ""),
    description: String(value.description ?? ""),
  };
}

function readStockPatch(value: Record<string, unknown>): Partial<StockInput> {
  const patch: Partial<StockInput> = {};
  for (const key of ["make", "model", "version", "firstRegistration", "fuel", "transmission", "body", "postalCode", "city", "vatRegime", "description"] as const) {
    if (typeof value[key] === "string") patch[key] = value[key];
  }
  if (typeof value.priceEur === "number") patch.priceEur = value.priceEur;
  if (typeof value.mileageKm === "number") patch.mileageKm = value.mileageKm;
  if (typeof value.powerKw === "number") patch.powerKw = value.powerKw;
  return patch;
}

export async function handleListStock(request: Request) {
  const actor = await actorFrom(request);
  if (!isActor(actor)) return actor;
  try {
    requireDealerActor(actor);
    return json({ vehicles: await listOwnStock(actor) });
  } catch (error) {
    if (isDealerAccessError(error)) return json({ error: "forbidden" }, 403);
    throw error;
  }
}

export async function handleCreateStock(request: Request) {
  const actor = await actorFrom(request);
  if (!isActor(actor)) return actor;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const vehicle = await createOwnVehicle(actor, readStockInput(body));
    return json({ vehicle }, 201);
  } catch (error) {
    if (error instanceof StockValidationError) return json({ error: error.message }, 422);
    if (isDealerAccessError(error)) return json({ error: "forbidden" }, 403);
    throw error;
  }
}

export async function handleUpdateStock(request: Request, vehicleId: string) {
  const actor = await actorFrom(request);
  if (!isActor(actor)) return actor;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const publicationStatus = body.publicationStatus;
    if (publicationStatus !== undefined && !publicationStatuses.includes(publicationStatus as PublicationStatus)) {
      return json({ error: "ongeldige publicatiestatus" }, 422);
    }
    const vehicle = await updateOwnVehicle(actor, vehicleId, {
      ...readStockPatch(body),
      ...(publicationStatus ? { publicationStatus: publicationStatus as PublicationStatus } : {}),
    });
    if (!vehicle) return json({ error: "not-found" }, 404);
    return json({ vehicle });
  } catch (error) {
    if (error instanceof StockValidationError) return json({ error: error.message }, 422);
    if (error instanceof DealerAccessError) return json({ error: "forbidden" }, 403);
    throw error;
  }
}

export async function handleImportStock(request: Request) {
  const actor = await actorFrom(request);
  if (!isActor(actor)) return actor;
  if (actor.role !== "dealer_admin") return json({ error: "forbidden" }, 403);
  const contentType = request.headers.get("content-type") ?? "";
  const csv = contentType.includes("application/json")
    ? String(((await request.json()) as { csv?: unknown }).csv ?? "")
    : await request.text();
  if (csv.length > 1_000_000) return json({ error: "bestand te groot" }, 413);
  try {
    return json(await importDealerCsv(actor, csv));
  } catch (error) {
    if (error instanceof DealerAccessError) return json({ error: "forbidden" }, 403);
    throw error;
  }
}

export async function handleAdminListStock(request: Request) {
  const actor = await actorFrom(request);
  if (!isActor(actor)) return actor;
  try {
    return json({ vehicles: await listAllStockAsAdmin(actor) });
  } catch (error) {
    if (error instanceof DealerAccessError) return json({ error: "forbidden" }, 403);
    throw error;
  }
}
