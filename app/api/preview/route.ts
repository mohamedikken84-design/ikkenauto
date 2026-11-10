import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export async function POST(request: Request) {
  const password = process.env.PREVIEW_PASSWORD ?? "";
  const form = await request.formData();
  const given = String(form.get("password") ?? "");
  const home = new URL("/", request.url);
  if (!password || !timingSafeEqual(digest(given), digest(password))) {
    return Response.redirect(new URL("/teaser", request.url), 303);
  }
  const response = Response.redirect(home, 303);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append("set-cookie", `ikken_preview=${encodeURIComponent(given)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`);
  return response;
}
