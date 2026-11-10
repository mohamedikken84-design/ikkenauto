import { readAnySessionToken } from "@/lib/dealer/auth-http";
import { AuthConfigError, resolveActor } from "@/lib/dealer/auth";
import { isPhotoError, addVehiclePhoto, reorderVehiclePhotos } from "@/lib/dealer/photos";
import { isDealerAccessError } from "@/lib/dealer/stock";

async function actorFrom(request: Request) {
  try {
    const actor = await resolveActor(readAnySessionToken(request));
    if (!actor) return Response.json({ error: "unauthorized" }, { status: 401 });
    return actor;
  } catch (error) {
    if (error instanceof AuthConfigError) return Response.json({ error: "auth-not-configured" }, { status: 503 });
    throw error;
  }
}

export async function POST(request: Request, context: RouteContext<"/api/dealer/stock/[id]/photos">) {
  const actor = await actorFrom(request);
  if (actor instanceof Response) return actor;
  const { id } = await context.params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Kies een fotobestand." }, { status: 422 });
  try {
    const photo = await addVehiclePhoto(actor, id, Buffer.from(await file.arrayBuffer()));
    if (!photo) return Response.json({ error: "not-found" }, { status: 404 });
    return Response.json({ photo }, { status: 201 });
  } catch (error) {
    if (isPhotoError(error)) return Response.json({ error: error.message }, { status: 422 });
    if (isDealerAccessError(error)) return Response.json({ error: "forbidden" }, { status: 403 });
    throw error;
  }
}

export async function PATCH(request: Request, context: RouteContext<"/api/dealer/stock/[id]/photos">) {
  const actor = await actorFrom(request);
  if (actor instanceof Response) return actor;
  const { id } = await context.params;
  const body = (await request.json()) as { orderedIds?: unknown };
  if (!Array.isArray(body.orderedIds)) return Response.json({ error: "Volgorde ontbreekt." }, { status: 422 });
  try {
    const ok = await reorderVehiclePhotos(actor, id, body.orderedIds.map(String));
    if (!ok) return Response.json({ error: "not-found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    if (isDealerAccessError(error)) return Response.json({ error: "forbidden" }, { status: 403 });
    throw error;
  }
}
