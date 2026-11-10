import { withService } from "@/lib/db/client";

export async function pingDatabase() {
  await withService((client) => client.query("SELECT 1"));
}

export async function handleKeepAlive(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const header = request.headers.get("authorization") ?? "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  await pingDatabase();
  return Response.json({ ok: true });
}
