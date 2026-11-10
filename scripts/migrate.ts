import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { closePool, getPool } from "../lib/db/client";

export async function migrate() {
  const pool = getPool();
  await ensureAuthStubs(pool);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const directory = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const applied = await pool.query("SELECT 1 FROM schema_migrations WHERE version = $1", [file]);
    if (applied.rowCount) continue;
    const sql = await readFile(path.join(directory, file), "utf8");
    const autocommit = sql.startsWith("-- migrate:no-transaction");
    const client = await pool.connect();
    try {
      if (autocommit) {
        const statements = sql
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .split(";")
          .map((statement) => statement.trim())
          .filter(Boolean);
        for (const statement of statements) {
          await client.query(statement);
        }
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      } else {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
        await client.query("COMMIT");
      }
    } catch (error) {
      if (!autocommit) await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  await grantServiceRole(pool);
}

async function ensureAuthStubs(pool: ReturnType<typeof getPool>) {
  const existing = await pool.query<{ name: string | null }>("SELECT to_regclass('auth.users')::text AS name");
  if (existing.rows[0]?.name) return;
  if (process.env.NODE_ENV === "production" || process.env.AUTH_MODE === "production") {
    throw new Error("auth.users ontbreekt. In productie zijn lokale auth-stubs uitgeschakeld; koppel Supabase.");
  }
  const member = await pool.query<{ ok: boolean }>("SELECT pg_has_role(current_user, 'service_role', 'member') AS ok");
  if (!member.rows[0]?.ok) {
    throw new Error("Rol service_role ontbreekt voor deze databasegebruiker. Draai scripts/setup-local-db.sh.");
  }
  const sql = await readFile(path.join(process.cwd(), "db", "local", "auth_storage_stubs.sql"), "utf8");
  await pool.query(sql);
}

async function grantServiceRole(pool: ReturnType<typeof getPool>) {
  const functions = [
    "private.set_updated_at()",
    "private.is_public_closed()",
    "private.is_platform_admin()",
    "private.is_garage_member(uuid)",
    "private.is_garage_owner(uuid)",
    "public.is_garage_member(uuid)",
    "private.handle_new_user()",
    "private.garages_guard()",
    "private.vehicles_guard()",
    "private.vehicle_photos_guard()",
    "private.garage_members_guard()",
    "private.storage_object_allowed(text)",
    "private.vehicle_is_public(uuid)",
    "private.sync_row_garage_id()",
    "private.setting_bool(text, boolean)",
    "private.setting_int(text, integer)",
    "private.profiles_guard()",
  ];
  await pool.query("GRANT ALL ON SCHEMA private, auth, storage TO service_role");
  await pool.query("GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role");
  await pool.query("GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role");
  await pool.query("GRANT ALL ON ALL TABLES IN SCHEMA storage TO service_role");
  for (const name of functions) {
    await pool.query(`ALTER FUNCTION ${name} OWNER TO service_role`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(async () => {
      await closePool();
    })
    .catch(async (error: unknown) => {
      console.error(error);
      await closePool();
      process.exit(1);
    });
}
