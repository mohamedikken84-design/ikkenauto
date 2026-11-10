import { NextResponse, type NextRequest } from "next/server";
import { previewAllows } from "@/lib/preview";

export function proxy(request: NextRequest) {
  const allowed = previewAllows({
    password: process.env.PREVIEW_PASSWORD,
    cookie: request.cookies.get("ikken_preview")?.value,
    pathname: request.nextUrl.pathname,
  });
  const response = allowed ? NextResponse.next() : NextResponse.rewrite(new URL("/teaser", request.url));
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
