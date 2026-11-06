import { randomBytes } from "node:crypto";
import { hashSessionToken } from "../lib/dealer/auth";
import { closePool, getPool } from "../lib/db/client";
import { migrate } from "./migrate";

const role = process.argv.includes("--staff") ? "dealer_staff" : "dealer_admin";
const dealerName = process.env.DEV_DEALER_NAME?.trim() || "Ontwikkeldealer";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.AUTH_MODE === "production") {
    throw new Error("Dit script maakt geen productiesessie en is geen login.");
  }
  await migrate();
  const pool = getPool();
  const dealer = await pool.query<{ id: string }>(
    "INSERT INTO dealers (name) VALUES ($1) RETURNING id",
    [dealerName],
  );
  const dealerId = dealer.rows[0].id;
  const email = `dev-${randomBytes(4).toString("hex")}@example.test`;
  const user = await pool.query<{ id: string }>(
    `INSERT INTO users (dealer_id, role, email, display_name)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [dealerId, role, email, "Ontwikkelsessie"],
  );
  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '8 hours')`,
    [user.rows[0].id, hashSessionToken(token)],
  );
  console.log("Ontwikkelsessie, geen productieauth. Token eenmalig:");
  console.log(token);
  console.log(`dealer ${dealerId} rol ${role}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
