"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { copyFor } from "@/lib/i18n/auth-copy";
import type { Locale } from "@/lib/i18n/locale";
import { primaryNav, site } from "@/lib/site";

export function SiteHeader({ locale }: { locale: Locale }) {
  const path = usePathname();
  if (path.startsWith("/account")) return <AuthHeader locale={locale} path={path} />;
  return <MarketHeader />;
}

function MarketHeader() {
  return (
    <header className="border-b-2 border-gold bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Logo href="/" />
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
    </header>
  );
}

function AuthHeader({ locale, path }: { locale: Locale; path: string }) {
  const text = copyFor(locale);
  const router = useRouter();
  const onLogin = path.startsWith("/account/login");
  function choose(next: Locale) {
    document.cookie = `ikken_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
    router.refresh();
  }
  return (
    <header className="border-b-2 border-gold bg-surface">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Logo href="/" />
        <div className="flex items-center gap-3">
          <div className="flex min-h-11 items-center gap-2 text-sm font-semibold" aria-label={text.portalLanguage}>
            <button type="button" className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline" aria-pressed={locale === "nl"} onClick={() => choose("nl")}>
              NL
            </button>
            <span aria-hidden="true">|</span>
            <button type="button" className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline" aria-pressed={locale === "fr"} onClick={() => choose("fr")}>
              FR
            </button>
          </div>
          <Link className="inline-flex min-h-11 items-center text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4" href={onLogin ? "/account/registreren" : "/account/login"}>
            {onLogin ? text.noAccount : text.login}
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
