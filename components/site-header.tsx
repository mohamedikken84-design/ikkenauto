"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { copyFor } from "@/lib/i18n/auth-copy";
import type { Locale } from "@/lib/i18n/locale";
import { primaryNav, site } from "@/lib/site";

export function SiteHeader({ locale }: { locale: Locale }) {
  const path = usePathname();
  if (path.startsWith("/account")) return <AuthHeader locale={locale} path={path} />;
  return <MarketHeader locale={locale} path={path} />;
}

function localeHref(path: string, next: "nl" | "fr") {
  if (path === "/nl" || path.startsWith("/nl/")) return `/${next}${path.slice(3)}` || `/${next}`;
  if (path === "/fr" || path.startsWith("/fr/")) return `/${next}${path.slice(3)}` || `/${next}`;
  return `/${next}`;
}

function MarketHeader({ locale, path }: { locale: Locale; path: string }) {
  return (
    <header className="border-b-2 border-gold bg-surface">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Logo href={`/${locale}`} />
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 text-sm font-semibold">
            <Link href={localeHref(path, "nl")} className="inline-flex size-11 items-center justify-center" hrefLang="nl" aria-current={locale === "nl" ? "true" : undefined}>
              NL
            </Link>
            <span aria-hidden="true">|</span>
            <Link href={localeHref(path, "fr")} className="inline-flex size-11 items-center justify-center" hrefLang="fr" aria-current={locale === "fr" ? "true" : undefined}>
              FR
            </Link>
          </div>
        <nav aria-label="Hoofdnavigatie">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-5">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline-offset-4 hover:text-gold-deep hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        </div>
      </div>
    </header>
  );
}

function AuthHeader({ locale, path }: { locale: Locale; path: string }) {
  const text = copyFor(locale);
  const router = useRouter();
  const onLogin = path.startsWith("/account/login");
  async function choose(next: Locale) {
    document.cookie = `ikken_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
    try {
      const csrfResponse = await fetch("/api/auth/csrf");
      const csrfBody = (await csrfResponse.json()) as { token?: string };
      await fetch("/api/account/locale", {
        method: "POST",
        headers: { "content-type": "application/json", origin: window.location.origin },
        body: JSON.stringify({ locale: next, uiLocale: next, csrf: csrfBody.token ?? "" }),
      });
    } catch {
      // De cookie blijft de fallback wanneer het profiel niet bereikbaar is.
    }
    router.refresh();
  }
  return (
    <header className="border-b-2 border-gold bg-surface">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4">
        <Logo href="/" />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm font-semibold" aria-label={text.portalLanguage}>
            <button type="button" className="inline-flex size-11 items-center justify-center underline-offset-4 hover:underline" aria-pressed={locale === "nl"} onClick={() => choose("nl")}>
              NL
            </button>
            <span aria-hidden="true">|</span>
            <button type="button" className="inline-flex size-11 items-center justify-center underline-offset-4 hover:underline" aria-pressed={locale === "fr"} onClick={() => choose("fr")}>
              FR
            </button>
          </div>
          <Link className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4" href={onLogin ? "/account/registreren" : "/account/login"}>
            {onLogin ? text.registerLink : text.login}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center">
      <span className="font-display text-[1.7rem] leading-none font-medium tracking-tight text-ink">{site.name}</span>
      <span className="font-display text-lg leading-none text-gold-deep">.be</span>
    </Link>
  );
}
