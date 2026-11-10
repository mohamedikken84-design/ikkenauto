import Link from "next/link";
import { legalNav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-gold bg-ink text-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <p className="font-display text-2xl">
            {site.name}
            <span className="text-gold">.be</span>
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-paper/80">
            Belgische automarktplaats in opbouw. Deze versie plaatst geen
            analysecookies en geen marketingcookies. Een contactbericht op een
            advertentie blijft in deze browser en wordt niet gemaild.
          </p>
        </div>
        <nav aria-label="Juridische informatie">
          <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">
            Juridisch
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-sm text-paper/80 underline-offset-4 hover:text-gold hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-paper/60">
            Privacy, cookies en voorwaarden zijn placeholders. Het zijn nog geen
            geldige juridische teksten.
          </p>
        </nav>
      </div>
    </footer>
  );
}
