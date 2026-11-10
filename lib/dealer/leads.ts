import { randomUUID } from "node:crypto";
import { withService, withTransaction } from "@/lib/db/client";
import { dealerContext } from "@/lib/dealer/stock";
import { assertRateLimit } from "@/lib/dealer/rate-limit";
import type { Actor } from "@/lib/dealer/types";

export class LeadInputError extends Error {}
export class LeadClosedError extends Error {}

const statuses = ["new", "in_progress", "won", "lost", "spam"] as const;
export type LeadStatus = (typeof statuses)[number];

export type LeadInput = {
  vehicleId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  locale?: string;
  consent: boolean;
  honeypot?: string;
};

export type LeadRow = {
  id: string;
  vehicleId: string | null;
  status: LeadStatus;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  locale: string;
  createdAt: string;
};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 200;
}

async function siteIsClosed() {
  if (process.env.PUBLIC_CLOSED !== "false") return true;
  const row = await withService((client) =>
    client.query<{ value: boolean }>("SELECT value FROM app_settings WHERE key = 'public_closed'"),
  );
  return row.rows[0]?.value !== false;
}

export async function createPublicLead(input: LeadInput, clientKey: string) {
  if ((input.honeypot ?? "").trim()) return { ok: true as const };
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();
  if (!input.consent) throw new LeadInputError("Bevestig dat wij u mogen contacteren over deze auto.");
  if (!name || name.length > 80) throw new LeadInputError("Vul uw naam in (maximaal 80 tekens).");
  if (!validEmail(email)) throw new LeadInputError("Voer een geldig e-mailadres in.");
  if (!message || message.length > 2000) throw new LeadInputError("Schrijf een bericht van hoogstens 2000 tekens.");
  await assertRateLimit("lead-ip", clientKey);
  await assertRateLimit("lead-vehicle", `${clientKey}:${input.vehicleId}`);
  if (await siteIsClosed()) throw new LeadClosedError("De site is nog niet open voor aanvragen.");

  const vehicle = await withService((client) =>
    client.query<{ garage_id: string }>(
      `SELECT garage_id FROM vehicles
       WHERE id = $1 AND deleted_at IS NULL AND publication_status = 'published' AND fictional = false`,
      [input.vehicleId],
    ),
  );
  if (!vehicle.rows[0]) throw new LeadClosedError("Deze auto neemt geen aanvragen aan.");

  const locale = input.locale === "fr" ? "fr" : "nl";
  const leadId = randomUUID();
  const inserted = await withTransaction({ userId: null, access: "anon" }, async (client) => {
    await client.query(
      `INSERT INTO leads (id, garage_id, vehicle_id, name, email, phone, message, locale, source, consent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'listing', now())`,
      [leadId, vehicle.rows[0].garage_id, input.vehicleId, name, email, input.phone?.trim() || null, message, locale],
    );
    await client.query(
      `INSERT INTO vehicle_events (garage_id, vehicle_id, event_type) VALUES ($1, $2, 'contact')`,
      [vehicle.rows[0].garage_id, input.vehicleId],
    );
    return leadId;
  });
  return { ok: true as const, id: inserted };
}

export async function listGarageLeads(actor: Actor) {
  return dealerContext(actor, async (client, garageId) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string | null;
      status: LeadStatus;
      name: string;
      email: string;
      phone: string | null;
      message: string;
      locale: string;
      created_at: string;
    }>(
      `SELECT id, vehicle_id, status, name, email, phone, message, locale, created_at
       FROM leads WHERE garage_id = $1 ORDER BY created_at DESC`,
      [garageId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      status: row.status,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      locale: row.locale,
      createdAt: row.created_at,
    }));
  });
}

export async function updateLeadStatus(actor: Actor, leadId: string, status: string) {
  if (!statuses.includes(status as LeadStatus)) throw new LeadInputError("Ongeldige status.");
  return dealerContext(actor, async (client, garageId) => {
    const result = await client.query<{ id: string }>(
      `UPDATE leads SET status = $3 WHERE id = $1 AND garage_id = $2 RETURNING id`,
      [leadId, garageId, status],
    );
    return result.rows[0]?.id ?? null;
  });
}
