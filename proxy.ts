import { NextResponse, type NextRequest } from "next/server";
import { previewAllows } from "@/lib/preview";

function localeFromAccept(header: string) {
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("fr") ? "fr" : "nl";
}

function closedToCrawlers() {
  return process.env.PUBLIC_CLOSED !== "false";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Keep the future public marketplace separate: only the dealer subdomain
  // opens the dealer portal at its root.
  if (pathname === "/" && request.nextUrl.hostname === "portal.ikkenauto.be") {
    const response = NextResponse.redirect(new URL("/portal", request.url));
    if (closedToCrawlers()) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  if (pathname === "/") {
    const cookie = request.cookies.get("ikken_locale")?.value;
    const locale = cookie === "fr" || cookie === "nl" ? cookie : localeFromAccept(request.headers.get("accept-language") ?? "");
    const redirect = NextResponse.redirect(new URL(`/${locale}`, request.url));
    if (closedToCrawlers()) redirect.headers.set("X-Robots-Tag", "noindex, nofollow");
    return redirect;
  }
  const allowed = previewAllows({
    password: process.env.PREVIEW_PASSWORD,
    cookie: request.cookies.get("ikken_preview")?.value,
    pathname,
  });
  const requestHeaders = new Headers(request.headers);
  if (pathname === "/nl" || pathname.startsWith("/nl/")) requestHeaders.set("x-ikken-path-locale", "nl");
  else if (pathname === "/fr" || pathname.startsWith("/fr/")) requestHeaders.set("x-ikken-path-locale", "fr");
  const response = allowed
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : NextResponse.rewrite(new URL("/teaser", request.url), { request: { headers: requestHeaders } });
  if (closedToCrawlers()) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (pathname.startsWith("/api/auth/exchange") || pathname.startsWith("/account/verifieer") || pathname.startsWith("/account/herstel")) {
    response.headers.set("Referrer-Policy", "no-referrer");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
