import { Pool, type PoolClient } from "pg";

let pool: Pool | null = null;

export type DbAccess = {
  userId: string | null;
  appRole?: string;
  access: "anon" | "authenticated" | "service";
};

export function databaseUrl() {
  return process.env.DATABASE_URL?.trim() ?? "";
}

export function getPool() {
  const connectionString = databaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL ontbreekt. Er is geen onbeveiligde voorraadfallback.");
  }
  pool ??= new Pool({ connectionString, max: 4 });
  return pool;
}

export async function closePool() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

export async function withTransaction<T>(access: DbAccess, fn: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const claims = JSON.stringify({
      sub: access.userId ?? "",
      role: access.access === "anon" ? "anon" : "authenticated",
      app_metadata: { role: access.appRole ?? "" },
    });
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [claims]);
    if (access.access === "service") await client.query("SET LOCAL ROLE service_role");
    else if (access.access === "anon") await client.query("SET LOCAL ROLE anon");
    else await client.query("SET LOCAL ROLE authenticated");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function withService<T>(fn: (client: PoolClient) => Promise<T>) {
  return withTransaction({ userId: null, access: "service" }, fn);
}
