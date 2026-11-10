import { NextResponse, type NextRequest } from "next/server";

function localeFromAccept(header: string) {
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("fr") ? "fr" : "nl";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") {
    const cookie = request.cookies.get("ikken_locale")?.value;
    const locale = cookie === "fr" || cookie === "nl" ? cookie : localeFromAccept(request.headers.get("accept-language") ?? "");
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }
  const requestHeaders = new Headers(request.headers);
  if (pathname === "/nl" || pathname.startsWith("/nl/")) requestHeaders.set("x-ikken-path-locale", "nl");
  else if (pathname === "/fr" || pathname.startsWith("/fr/")) requestHeaders.set("x-ikken-path-locale", "fr");
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (pathname.startsWith("/api/auth/exchange") || pathname.startsWith("/account/verifieer") || pathname.startsWith("/account/herstel")) {
    response.headers.set("Referrer-Policy", "no-referrer");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
