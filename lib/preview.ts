import { createHash, timingSafeEqual } from "node:crypto";

const openPrefixes = ["/teaser", "/api/preview", "/account", "/api/", "/icon.svg", "/robots.txt", "/sitemap.xml"];

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function previewAllows(input: { password: string | undefined; cookie: string | undefined; pathname: string }) {
  if (!input.password) return true;
  if (openPrefixes.some((prefix) => input.pathname === prefix || input.pathname.startsWith(prefix))) return true;
  if (!input.cookie) return false;
  return timingSafeEqual(digest(input.cookie), digest(input.password));
}
