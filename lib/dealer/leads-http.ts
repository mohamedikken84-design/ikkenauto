import { AuthConfigError, DealerAccessError, resolveActor } from "@/lib/dealer/auth";
import { readAnySessionToken } from "@/lib/dealer/auth-http";
import { RateLimitError } from "@/lib/dealer/rate-limit";
import { LeadClosedError, LeadInputError, createPublicLead, listGarageLeads, updateLeadStatus } from "@/lib/dealer/leads";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function clientKey(request: Request) {
  return (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0]?.trim() || "unknown";
}

export async function handleCreateLead(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createPublicLead(
      {
        vehicleId: String(body.vehicleId ?? ""),
        name: String(body.name ?? ""),
        email: String(body.email ?? ""),
        phone: body.phone == null ? undefined : String(body.phone),
        message: String(body.message ?? ""),
        locale: String(body.locale ?? "nl"),
        consent: body.consent === true || body.consent === "on",
        honeypot: String(body.company ?? ""),
      },
      clientKey(request),
    );
    return json(result, 201);
  } catch (error) {
    if (error instanceof LeadInputError) return json({ message: error.message }, 400);
    if (error instanceof LeadClosedError) return json({ message: error.message }, 403);
    if (error instanceof RateLimitError) return json({ message: "U hebt te vaak geprobeerd. Wacht 15 minuten en probeer opnieuw." }, 429);
    throw error;
  }
}

export async function handleListLeads(request: Request) {
  try {
    const actor = await resolveActor(readAnySessionToken(request));
    if (!actor) return json({ error: "unauthorized" }, 401);
    return json({ leads: await listGarageLeads(actor) });
  } catch (error) {
    if (error instanceof DealerAccessError) return json({ error: "forbidden" }, 403);
    if (error instanceof AuthConfigError) return json({ error: "auth-niet-beschikbaar" }, 503);
    throw error;
  }
}

export async function handleUpdateLead(request: Request, leadId: string) {
  try {
    const actor = await resolveActor(readAnySessionToken(request));
    if (!actor) return json({ error: "unauthorized" }, 401);
    const body = (await request.json()) as { status?: unknown };
    const id = await updateLeadStatus(actor, leadId, String(body.status ?? ""));
    if (!id) return json({ error: "not-found" }, 404);
    return json({ ok: true });
  } catch (error) {
    if (error instanceof LeadInputError) return json({ message: error.message }, 400);
    if (error instanceof DealerAccessError) return json({ error: "forbidden" }, 403);
    if (error instanceof AuthConfigError) return json({ error: "auth-niet-beschikbaar" }, 503);
    throw error;
  }
}
