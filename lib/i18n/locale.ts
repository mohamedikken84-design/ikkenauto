import { cookies, headers } from "next/headers";

export type Locale = "nl" | "fr";

export function localeFromAccept(header: string): Locale {
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("fr") ? "fr" : "nl";
}

export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get("ikken_locale")?.value;
  if (chosen === "nl" || chosen === "fr") return chosen;
  return localeFromAccept((await headers()).get("accept-language") ?? "");
}
