import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { withService } from "@/lib/db/client";
import type { Actor } from "@/lib/dealer/types";

export class AuthConfigError extends Error {}
export class DealerAccessError extends Error {}

const sessionHours = 8;

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
}

export function assertLocalAuthAllowed() {
  if (process.env.NODE_ENV === "production" || process.env.AUTH_MODE === "production") {
    if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      throw new AuthConfigError(
        "Productieauth is niet gekoppeld. Lokale stubs en de mailsink zijn uitgeschakeld.",
      );
    }
  }
  const mode = process.env.AUTH_MODE?.trim();
  if (!supabaseConfigured() && mode !== "local" && mode !== "development-session") {
    throw new AuthConfigError("AUTH_MODE ontbreekt. Gebruik local buiten productie, of koppel Supabase.");
  }
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([A-Za-z0-9._-]+)$/.exec(header);
  return match?.[1] ?? "";
}

function jwtSecret() {
  const configured = process.env.AUTH_JWT_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production" || process.env.AUTH_MODE === "production") {
    throw new AuthConfigError("AUTH_JWT_SECRET ontbreekt.");
  }
  const globalState = globalThis as { __ikkenJwt?: string };
  globalState.__ikkenJwt ??= randomBytes(32).toString("base64url");
  return globalState.__ikkenJwt;
}

function signJwt(userId: string, email: string) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      jti: randomBytes(16).toString("base64url"),
      exp: Math.floor(Date.now() / 1000) + sessionHours * 3600,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", jwtSecret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function readJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const signature = createHmac("sha256", jwtSecret()).update(`${parts[0]}.${parts[1]}`).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(parts[2]);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      sub?: string;
      exp?: number;
    };
    if (!payload.sub || !payload.exp || payload.exp * 1000 <= Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function insertLocalSession(userId: string) {
  const found = await withService((client) =>
    client.query<{ email: string }>("SELECT email FROM auth.users WHERE id = $1", [userId]),
  );
  const email = found.rows[0]?.email;
  if (!email) throw new AuthConfigError("Gebruiker ontbreekt.");
  const token = signJwt(userId, email);
  await withService((client) =>
    client.query(
      `INSERT INTO auth.local_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '8 hours')`,
      [userId, hashSessionToken(token)],
    ),
  );
  return token;
}

export async function resolveActor(token: string): Promise<Actor | null> {
  assertLocalAuthAllowed();
  if (!token) return null;
  const userId = readJwt(token);
  if (!userId) return null;
  const result = await withService((client) =>
    client.query<{
      user_id: string;
      email: string;
      is_admin: boolean;
      garage_id: string | null;
      member_role: string | null;
    }>(
      `SELECT u.id AS user_id, u.email,
              (pa.user_id IS NOT NULL) AS is_admin,
              m.garage_id, m.role AS member_role
       FROM auth.local_sessions s
       JOIN auth.users u ON u.id = s.user_id
       LEFT JOIN public.platform_admins pa ON pa.user_id = u.id
       LEFT JOIN public.garage_members m ON m.user_id = u.id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND s.revoked_at IS NULL
         AND u.email_confirmed_at IS NOT NULL
       ORDER BY CASE WHEN m.role = 'owner' THEN 0 ELSE 1 END
       LIMIT 1`,
      [hashSessionToken(token)],
    ),
  );
  const row = result.rows[0];
  if (!row || row.user_id !== userId) return null;
  if (row.is_admin) {
    return { userId: row.user_id, role: "platform_admin", dealerId: row.garage_id, email: row.email };
  }
  if (row.member_role === "owner") {
    return { userId: row.user_id, role: "dealer_admin", dealerId: row.garage_id, email: row.email };
  }
  if (row.member_role === "staff") {
    return { userId: row.user_id, role: "dealer_staff", dealerId: row.garage_id, email: row.email };
  }
  return { userId: row.user_id, role: "private_user", dealerId: null, email: row.email };
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

export function actorAccess(actor: Actor) {
  return {
    userId: actor.userId,
    appRole: actor.role === "platform_admin" ? "platform_admin" : "",
    access: "authenticated" as const,
  };
}
