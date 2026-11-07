import { Pool, type PoolClient } from "pg";

let pool: Pool | null = null;

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

export async function withTransaction<T>(
  settings: { dealerId: string | null; role: string; publicRead: boolean; userId?: string | null },
  fn: (client: PoolClient) => Promise<T>,
) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.dealer_id', $1, true)", [settings.dealerId ?? ""]);
    await client.query("SELECT set_config('app.role', $1, true)", [settings.role]);
    await client.query("SELECT set_config('app.user_id', $1, true)", [settings.userId ?? ""]);
    await client.query("SELECT set_config('app.public_read', $1, true)", [settings.publicRead ? "on" : "off"]);
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
