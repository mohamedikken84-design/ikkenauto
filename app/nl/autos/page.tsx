import Link from "next/link";
import { Suspense } from "react";
import { FilterForm } from "@/components/listings/filter-form";
import { ResultCard } from "@/components/listings/result-card";
import { activeChips, hasActiveFilters, searchListings } from "@/lib/listings/filter";
import { formatCount } from "@/lib/listings/format";
import { parseSearch } from "@/lib/listings/query";
import { knownPostcodes, listings, modelsByMake, postcodes } from "@/lib/listings/seed";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Auto's zoeken",
  description:
    "Zoek in de Belgische dealerseed van IKKENAUTO.be op merk, model, prijs, kilometer, bouwjaar, brandstof en afstand.",
  path: "/nl/autos",
});

export default function AutosPage(props: PageProps<"/nl/autos">) {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchScreen searchParams={props.searchParams} />
    </Suspense>
  );
}

async function SearchScreen({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const groupedModels = modelsByMake();
  const makes = Object.keys(groupedModels);
  const parsed = parseSearch(await searchParams, {
    makes,
    models: listings.map((listing) => listing.model),
  });
  const filters = parsed.filters;
  const search = searchListings(listings, filters, postcodes);
  const chips = activeChips(filters);
  const locationHint = locationMessage(filters.postalCode, filters.radiusKm, search.unknownPostalCode, search.origin?.city);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <div className="lg:sticky lg:top-4">
        <FilterForm
          filters={filters}
          makes={makes}
          modelsByMake={groupedModels}
          postcodes={knownPostcodes().map((entry) => ({ postalCode: entry.postalCode, city: entry.city }))}
        />
      </div>
      <section aria-labelledby="resultaten-titel">
        <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">Dealerseed · België</p>
        <h1 id="resultaten-titel" className="mt-2 font-display text-4xl leading-tight">
          Auto&apos;s zoeken
        </h1>
        <p className="mt-3 font-display text-3xl">{formatCount(search.results.length)}</p>
        <p className="mt-1 text-muted">van {formatCount(listings.length)} in de seed. Geen live voorraad en geen scraping.</p>
        <p className="mt-1 text-sm text-muted">Volgorde: prijs, laag naar hoog. Een andere sortering is er niet.</p>
        {parsed.notices.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {parsed.notices.map((notice) => (
              <li key={notice.id} className="border border-ink bg-surface px-3 py-2 text-sm" role="status">
                {notice.text}
              </li>
            ))}
          </ul>
        ) : null}
        {locationHint ? <p className="mt-3 text-sm leading-6 text-ink">{locationHint}</p> : null}
        {chips.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={`${chip.href}-${chip.label}`}>
                <Link
                  href={chip.href}
                  scroll={false}
                  className="inline-flex min-h-10 items-center border border-ink px-3 text-sm hover:border-gold-deep"
                >
                  {chip.label}
                  <span aria-hidden="true"> ×</span>
                  <span className="sr-only">, filter verwijderen</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {search.results.length === 0 ? (
          <EmptyResults
            unknownPostalCode={search.unknownPostalCode}
            postalCode={filters.postalCode}
            suggestions={search.suggestions}
            showClear={hasActiveFilters(filters)}
          />
        ) : (
          <ol className="mt-6 grid gap-4">
            {search.results.map((listing) => (
              <li key={listing.id}>
                <ResultCard listing={listing} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function locationMessage(
  postalCode: string,
  radiusKm: number | null,
  unknownPostalCode: boolean,
  city: string | undefined,
) {
  if (!postalCode) return null;
  if (unknownPostalCode) {
    return `Postcode ${postalCode} kennen we niet in deze seed. Kies een postcode uit de lijst, of wis ze.`;
  }
  if (radiusKm === null) {
    return `Postcode ${postalCode} (${city}) beperkt de lijst nog niet. Kies een straal om op afstand te filteren.`;
  }
  return `Binnen ${radiusKm} km van ${postalCode} ${city}.`;
}

function EmptyResults({
  unknownPostalCode,
  postalCode,
  suggestions,
  showClear,
}: {
  unknownPostalCode: boolean;
  postalCode: string;
  suggestions: { href: string; label: string }[];
  showClear: boolean;
}) {
  return (
    <div className="mt-6 border border-line bg-surface p-6">
      <h2 className="font-display text-3xl">Geen auto&apos;s met deze filters</h2>
      <p className="mt-3 leading-relaxed text-muted">
        {unknownPostalCode
          ? `Er is geen centrum voor ${postalCode} in de seed, dus een straal levert niets op.`
          : "Versoepel minstens één filter. Het getal bij elk voorstel is de telling zonder dat filter."}
      </p>
      {suggestions.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion.href}>
              <Link href={suggestion.href} scroll={false} className="font-semibold underline decoration-gold decoration-2 underline-offset-4">
                {suggestion.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {showClear ? (
        <p className="mt-4">
          <Link href="/nl/autos" scroll={false} className="text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4">
            Wis alle filters
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16">
      <p className="text-sm font-semibold tracking-[0.16em] text-gold-deep uppercase">Dealerseed</p>
      <h1 className="mt-3 font-display text-4xl">Auto&apos;s laden</h1>
    </div>
  );
}
