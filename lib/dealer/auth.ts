import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "@/lib/db/client";
import type { Actor, DealerRole } from "@/lib/dealer/types";

export class AuthConfigError extends Error {}

export function assertAuthMode(): "development-session" | "production" {
  const mode = process.env.AUTH_MODE?.trim();
  if (mode === "production") return "production";
  if (mode === "development-session" && process.env.NODE_ENV !== "production") return "development-session";
  throw new AuthConfigError(
    "AUTH_MODE ontbreekt of is ongeldig. development-session werkt niet in productie en er is geen losse login.",
  );
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([A-Za-z0-9_-]+)$/.exec(header);
  return match?.[1] ?? "";
}

export async function resolveActor(token: string): Promise<Actor | null> {
  assertAuthMode();
  if (!token) return null;
  const result = await getPool().query<{
    user_id: string;
    role: DealerRole;
    dealer_id: string | null;
    email: string;
  }>(
    `SELECT u.id AS user_id, u.role, u.dealer_id, u.email
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashSessionToken(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { userId: row.user_id, role: row.role, dealerId: row.dealer_id, email: row.email };
}

export function requireDealerActor(actor: Actor) {
  if ((actor.role !== "dealer_admin" && actor.role !== "dealer_staff") || !actor.dealerId) {
    throw new DealerAccessError("forbidden");
  }
  return { ...actor, dealerId: actor.dealerId };
}

export function requireDealerAdmin(actor: Actor) {
  const dealer = requireDealerActor(actor);
  if (dealer.role !== "dealer_admin") throw new DealerAccessError("forbidden");
  return dealer;
}

export class DealerAccessError extends Error {}

export async function insertSession(client: PoolClient, userId: string, hours = 8) {
  const token = randomBytes(32).toString("base64url");
  await client.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' hours')::interval)`,
    [userId, hashSessionToken(token), String(hours)],
  );
  return token;
}
