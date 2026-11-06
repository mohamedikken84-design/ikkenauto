import Link from "next/link";
import { primaryNav, site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b-2 border-gold bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="inline-flex items-baseline">
          <span className="font-display text-[1.7rem] leading-none font-medium tracking-tight text-ink">
            {site.name}
          </span>
          <span className="font-display text-lg leading-none text-gold-deep">.be</span>
        </Link>
        <nav aria-label="Hoofdnavigatie">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-5">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-semibold text-ink underline-offset-4 hover:text-gold-deep hover:underline"
                >
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
