import Link from "next/link";
import type { Locale } from "@/lib/i18n/locale";
import { legalNav, site } from "@/lib/site";

const footerCopy = {
  nl: {
    blurb:
      "Belgische automarktplaats in opbouw. Deze versie plaatst geen analysecookies en geen marketingcookies. Een contactbericht op een advertentie blijft in deze browser en wordt niet gemaild.",
    legal: "Juridisch",
    navLabel: "Juridische informatie",
    note: "Privacy, cookies en voorwaarden zijn placeholders. Het zijn nog geen geldige juridische teksten.",
    labels: { "/privacy": "Privacy", "/cookies": "Cookies", "/voorwaarden": "Voorwaarden" },
  },
  fr: {
    blurb:
      "Place de marché automobile belge en construction. Cette version ne place pas de cookies d'analyse ni de cookies marketing. Un message de contact sur une annonce reste dans ce navigateur et n'est pas envoyé par e-mail.",
    legal: "Juridique",
    navLabel: "Informations juridiques",
    note: "La confidentialité, les cookies et les conditions sont des textes provisoires. Ce ne sont pas encore des textes juridiques valables.",
    labels: { "/privacy": "Confidentialité", "/cookies": "Cookies", "/voorwaarden": "Conditions" },
  },
} as const;

export function SiteFooter({ locale = "nl" }: { locale?: Locale }) {
  const text = footerCopy[locale];
  return (
    <footer className="border-t-2 border-gold bg-ink text-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <p className="font-display text-2xl">
            {site.name}
            <span className="text-gold">.be</span>
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-paper/80">{text.blurb}</p>
        </div>
        <nav aria-label={text.navLabel}>
          <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">{text.legal}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-sm text-paper/80 underline-offset-4 hover:text-gold hover:underline"
                >
                  {text.labels[item.href]}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-paper/60">{text.note}</p>
        </nav>
      </div>
    </footer>
  );
}
