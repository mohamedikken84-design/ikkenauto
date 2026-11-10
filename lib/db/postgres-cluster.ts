import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function restartPostgres() {
  const { stdout } = await execFileAsync("pg_lsclusters", ["--no-header"]);
  const [version, name] = stdout.trim().split(/\s+/);
  if (!version || !name) throw new Error("Geen PostgreSQL-cluster gevonden.");
  await execFileAsync("sudo", ["pg_ctlcluster", version, name, "restart"]);
}
