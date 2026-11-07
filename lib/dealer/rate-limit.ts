import { createHash } from "node:crypto";
import { getPool } from "@/lib/db/client";

const windowMinutes = 15;

export class RateLimitError extends Error {}

export function rateLimitMaximum() {
  if (process.env.NODE_ENV === "production" || process.env.AUTH_MODE === "production") return 5;
  const override = Number(process.env.AUTH_RATE_LIMIT_MAX);
  if (Number.isInteger(override) && override >= 1 && override <= 20) return override;
  return 5;
}

export async function assertRateLimit(action: string, subject: string) {
  const bucket = createHash("sha256").update(`${action}\n${subject}`).digest("hex");
  const max = rateLimitMaximum();
  const result = await getPool().query<{ attempts: number }>(
    `INSERT INTO auth_rate_limits (bucket, attempts, window_start)
     VALUES ($1, 1, now())
     ON CONFLICT (bucket) DO UPDATE SET
       attempts = CASE
         WHEN auth_rate_limits.window_start < now() - ($2 || ' minutes')::interval THEN 1
         ELSE auth_rate_limits.attempts + 1
       END,
       window_start = CASE
         WHEN auth_rate_limits.window_start < now() - ($2 || ' minutes')::interval THEN now()
         ELSE auth_rate_limits.window_start
       END
     RETURNING attempts`,
    [bucket, String(windowMinutes)],
  );
  if ((result.rows[0]?.attempts ?? 1) > max) {
    throw new RateLimitError("te veel pogingen");
  }
}

export const authRateLimitWindowMinutes = windowMinutes;
