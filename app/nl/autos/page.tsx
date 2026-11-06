import Link from "next/link";
import { Suspense } from "react";
import { FilterForm } from "@/components/listings/filter-form";
import { ResultCard } from "@/components/listings/result-card";
import { activeChips, hasActiveFilters, searchListings } from "@/lib/listings/filter";
import { formatCount } from "@/lib/listings/format";
import { listPublishedVehicles } from "@/lib/dealer/stock";
import type { VehicleRecord } from "@/lib/dealer/types";
import { parseSearch } from "@/lib/listings/query";
import { knownPostcodes, listings, modelsByMake, postcodes } from "@/lib/listings/seed";
import type { SearchFilters } from "@/lib/listings/types";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Auto's zoeken",
  description:
    "Gepubliceerde auto's op IKKENAUTO.be. Fictieve ontwikkeldata wordt niet als echte voorraad getoond.",
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
  const published = await loadPublished();
  const publishedResults = filterPublished(published.records, filters);
  const showFictional = process.env.NODE_ENV !== "production" && process.env.DEV_SHOW_FICTIONAL_CATALOG === "1";
  const fictional = showFictional ? searchListings(listings, filters, postcodes) : null;
  const chips = activeChips(filters);
  const locationHint = fictional
    ? locationMessage(filters.postalCode, filters.radiusKm, fictional.unknownPostalCode, fictional.origin?.city)
    : null;

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
        <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">Gepubliceerde voorraad</p>
        <h1 id="resultaten-titel" className="mt-2 font-display text-4xl leading-tight">
          Auto&apos;s zoeken
        </h1>
        <p className="mt-3 font-display text-3xl">{formatCount(publishedResults.length)}</p>
        <p className="mt-1 text-muted">
          {published.state === "unconfigured"
            ? "De voorraaddatabase is niet geconfigureerd. De fictieve seed wordt niet als echte stock getoond."
            : published.state === "unavailable"
              ? "De voorraaddatabase is niet bereikbaar. Er is geen fallback naar fictieve stock."
              : `Gepubliceerd en niet fictief. ${formatCount(published.records.length)} zonder de filters hierboven.`}
        </p>
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
        {fictional && locationHint ? <p className="mt-3 text-sm leading-6 text-ink">{locationHint}</p> : null}
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
        {filters.radiusKm !== null ? (
          <p className="mt-3 text-sm leading-6">
            Straal geldt niet voor gepubliceerde dealerstock zonder coördinaten. Die lijst filtert wel op de postcode zelf.
          </p>
        ) : null}
        {publishedResults.length === 0 ? (
          <EmptyResults
            unknownPostalCode={false}
            postalCode={filters.postalCode}
            suggestions={[]}
            showClear={hasActiveFilters(filters)}
            message="Geen gepubliceerde auto's met deze filters."
          />
        ) : (
          <ol className="mt-6 grid gap-4">
            {publishedResults.map((vehicle) => (
              <li key={vehicle.id} className="border border-line bg-surface p-4">
                <h2 className="font-display text-2xl">
                  {vehicle.make} {vehicle.model}
                </h2>
                <p className="text-sm text-muted">{vehicle.version}</p>
                <p className="mt-2 font-semibold">{vehicle.priceEur.toLocaleString("nl-BE")} EUR</p>
                <p className="text-sm">
                  {vehicle.firstRegistration} · {vehicle.mileageKm.toLocaleString("nl-BE")} km · {vehicle.fuel} ·{" "}
                  {vehicle.postalCode} {vehicle.city}
                </p>
              </li>
            ))}
          </ol>
        )}
        {fictional ? (
          <div className="mt-10 border border-gold bg-surface p-4">
            <h2 className="font-display text-2xl">Fictieve ontwikkeldata, geen echte voorraad</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {formatCount(fictional.results.length)} voorbeeldadvertenties. Ze komen niet uit de dealerdatabase en zijn
              niet gepubliceerde stock.
            </p>
            <ol className="mt-4 grid gap-4">
              {fictional.results.map((listing) => (
                <li key={listing.id}>
                  <ResultCard listing={listing} />
                </li>
              ))}
            </ol>
          </div>
        ) : null}
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
    return `Postcode ${postalCode} kennen we niet in de fictieve ontwikkeldata. Kies een postcode uit de lijst, of wis ze.`;
  }
  if (radiusKm === null) {
    return `Postcode ${postalCode} (${city}) beperkt de lijst nog niet. Kies een straal om op afstand te filteren.`;
  }
  return `Binnen ${radiusKm} km van ${postalCode} ${city}.`;
}

async function loadPublished(): Promise<{ state: "unconfigured" | "ready" | "unavailable"; records: VehicleRecord[] }> {
  if (!process.env.DATABASE_URL) return { state: "unconfigured", records: [] };
  try {
    return { state: "ready", records: await listPublishedVehicles() };
  } catch {
    return { state: "unavailable", records: [] };
  }
}

function filterPublished(records: VehicleRecord[], filters: SearchFilters) {
  return records.filter((record) => {
    if (filters.make && record.make.toLowerCase() !== filters.make.toLowerCase()) return false;
    if (filters.model && record.model.toLowerCase() !== filters.model.toLowerCase()) return false;
    if (filters.priceMin !== null && record.priceEur < filters.priceMin) return false;
    if (filters.priceMax !== null && record.priceEur > filters.priceMax) return false;
    if (filters.kmMax !== null && record.mileageKm > filters.kmMax) return false;
    const year = Number(record.firstRegistration.slice(0, 4));
    if (filters.yearMin !== null && year < filters.yearMin) return false;
    if (filters.yearMax !== null && year > filters.yearMax) return false;
    if (filters.fuel && record.fuel !== filters.fuel) return false;
    if (filters.transmission && record.transmission !== filters.transmission) return false;
    if (filters.body && record.body !== filters.body) return false;
    if (filters.postalCode && record.postalCode !== filters.postalCode) return false;
    return true;
  });
}

function EmptyResults({
  unknownPostalCode,
  postalCode,
  suggestions,
  showClear,
  message = "Geen auto's met deze filters.",
}: {
  unknownPostalCode: boolean;
  postalCode: string;
  suggestions: { href: string; label: string }[];
  showClear: boolean;
  message?: string;
}) {
  return (
    <div className="mt-6 border border-line bg-surface p-6">
      <h2 className="font-display text-3xl">Geen auto&apos;s met deze filters</h2>
      <p className="mt-3 leading-relaxed text-muted">
        {unknownPostalCode
          ? `Er is geen centrum voor ${postalCode} in de fictieve ontwikkeldata, dus een straal levert niets op.`
          : message}
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
