export async function indexingClosed() {
  if (process.env.PUBLIC_CLOSED !== "false") return true;
  if (!process.env.DATABASE_URL) return true;
  try {
    const { withService } = await import("@/lib/db/client");
    const row = await withService((client) =>
      client.query<{ value: boolean }>("SELECT value FROM app_settings WHERE key = 'public_closed'"),
    );
    return row.rows[0]?.value !== false;
  } catch {
    return true;
  }
}
