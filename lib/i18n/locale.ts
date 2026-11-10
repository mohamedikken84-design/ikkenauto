import { cookies, headers } from "next/headers";

export type Locale = "nl" | "fr";

export function localeFromAccept(header: string): Locale {
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("fr") ? "fr" : "nl";
}

export async function getLocale(): Promise<Locale> {
  const pathLocale = (await headers()).get("x-ikken-path-locale");
  if (pathLocale === "nl" || pathLocale === "fr") return pathLocale;
  if (process.env.DATABASE_URL) {
    try {
      const token = (await cookies()).get("ikken_session")?.value ?? "";
      if (token) {
        const { resolveActor } = await import("@/lib/dealer/auth");
        const { readOwnProfile } = await import("@/lib/dealer/account");
        const actor = await resolveActor(token).catch(() => null);
        if (actor) {
          const profile = await readOwnProfile(actor).catch(() => null);
          if (profile?.locale === "nl" || profile?.locale === "fr") return profile.locale;
        }
      }
    } catch {
      // Zonder database blijft de cookie de fallback.
    }
  }
  const chosen = (await cookies()).get("ikken_locale")?.value;
  if (chosen === "nl" || chosen === "fr") return chosen;
  return localeFromAccept((await headers()).get("accept-language") ?? "");
}
