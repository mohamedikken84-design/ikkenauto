import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Zoeken",
  description:
    "Zoekpagina van IKKENAUTO.be. Filteren op merk, model en prijs volgt; er is nog geen advertentiebestand.",
  path: "/zoeken",
});

export default function ZoekenPage() {
  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
      <p className="text-xs font-semibold tracking-[0.18em] text-gold-deep uppercase">
        Nog niet gebouwd
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-ink md:text-5xl">
        Zoeken op merk, model en prijs
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
        Hier komt het aanbod van IKKENAUTO.be. De zoekmotor is nog niet
        aangesloten. Velden in het adres, zoals merk of prijs, worden in deze
        versie genegeerd.
      </p>
      <div className="mt-8">
        <SearchForm idPrefix="zoeken" />
      </div>
      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-deep"
        >
          Terug naar de homepage
        </Link>
      </p>
    </article>
  );
}
