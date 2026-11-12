import { NextResponse, type NextRequest } from "next/server";
import { previewAllows } from "@/lib/preview";
import { dealerRouteKind, hasDealerShell, isDealerOnlyHost } from "@/lib/dealer/portal-visibility";

function localeFromAccept(header: string) {
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("fr") ? "fr" : "nl";
}

function closedToCrawlers() {
  return process.env.PUBLIC_CLOSED !== "false";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const dealerOnly=isDealerOnlyHost(request.nextUrl.hostname,process.env.IKKENAUTO_PORTAL_ONLY);
  if(dealerOnly){
    const kind=dealerRouteKind(pathname);
    if(kind==="home"||kind==="redirect"){
      const response=NextResponse.redirect(new URL("/portal",request.url));
      response.headers.set("X-Robots-Tag","noindex, nofollow");
      response.headers.set("Cache-Control","no-store");
      return response;
    }
    if(kind==="private-api"){
      return NextResponse.json({error:"not_found"},{status:404,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
    }
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
  // Force a standalone dealer layout: the marketplace navbar and footer must not render.
  if(hasDealerShell(pathname,dealerOnly))requestHeaders.set("x-ikken-dealer-shell","1");
  else requestHeaders.delete("x-ikken-dealer-shell");
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
