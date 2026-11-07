import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { closePool, getPool } from "../lib/db/client";

export async function migrate() {
  const pool = getPool();
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
