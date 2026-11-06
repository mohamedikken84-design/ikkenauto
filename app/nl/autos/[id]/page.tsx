import Link from "next/link";
import { notFound } from "next/navigation";
import { BackToResults } from "@/components/listings/back-to-results";
import { ContactForm } from "@/components/listings/contact-form";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { Gallery } from "@/components/listings/gallery";
import { formatEur, formatKm, formatRegistration, powerHp } from "@/lib/listings/format";
import { bodyLabel, fuelLabel, sellerLabel, transmissionLabel, vatDetail, vatLabel } from "@/lib/listings/labels";
import { getListing, listings } from "@/lib/listings/seed";
import { pageMetadata } from "@/lib/metadata";
import type { Listing } from "@/lib/listings/types";

export function generateStaticParams() {
  return listings.map((listing) => ({ id: listing.id }));
}

export async function generateMetadata(props: PageProps<"/nl/autos/[id]">) {
  const { id } = await props.params;
  const listing = getListing(id);
  if (!listing) {
    return { title: "Advertentie niet gevonden" };
  }
  return pageMetadata({
    title: `${listing.make} ${listing.model} ${listing.version}`,
    description: `${formatEur(listing.priceEur)}, ${formatKm(listing.mileageKm)}, ${listing.postalCode} ${listing.city}. ${listing.sellerName}.`,
    path: `/nl/autos/${listing.id}`,
  });
}

export default async function ListingPage(props: PageProps<"/nl/autos/[id]">) {
  const { id } = await props.params;
  const listing = getListing(id);
  if (!listing) notFound();
  return <ListingDetail listing={listing} />;
}

function ListingDetail({ listing }: { listing: Listing }) {
  const title = `${listing.make} ${listing.model}`;
  const specs = [
    ["Versie", listing.version],
    ["Eerste inschrijving", formatRegistration(listing.firstRegistration)],
    ["Kilometerstand", `${formatKm(listing.mileageKm)} (opgegeven door de verkoper)`],
    ["Brandstof", fuelLabel[listing.fuel]],
    ["Transmissie", transmissionLabel[listing.transmission]],
    ["Carrosserie", bodyLabel[listing.body]],
    ["Vermogen", `${listing.powerKw} kW (${powerHp(listing.powerKw)} pk)`],
    ["Kleur", listing.color],
    ["Deuren", String(listing.doors)],
    ["Zitplaatsen", String(listing.seats)],
    ["CO₂", `${listing.co2Gkm} g/km`],
    ["Euronorm", listing.euroNorm],
    ["Locatie", `${listing.postalCode} ${listing.city}`],
  ] as const;

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8">
      <p className="border border-gold bg-surface px-4 py-3 text-sm leading-6">
        Fictieve ontwikkeldata, geen echte voorraad. Deze pagina komt uit de voorbeeldseed en niet uit een gepubliceerde dealerstock.
      </p>
      <p className="mt-4 text-sm">
        <BackToResults />
        <span className="text-muted"> · </span>
        <Link href="/nl/autos" className="text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4">
          Alle auto&apos;s
        </Link>
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <Gallery listing={listing} />
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">
            {sellerLabel[listing.sellerType]}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight">{title}</h1>
          <p className="mt-2 text-lg text-muted">{listing.version}</p>
          <p className="mt-5 font-display text-4xl">{formatEur(listing.priceEur)}</p>
          <p className="mt-1 text-sm font-semibold tracking-wide text-gold-deep uppercase">{vatLabel[listing.vatRegime]}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{vatDetail[listing.vatRegime]}</p>
          <div className="mt-5">
            <FavoriteButton id={listing.id} title={title} />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="kenmerken">
          <h2 id="kenmerken" className="font-display text-3xl">
            Kenmerken
          </h2>
          <dl className="mt-4 grid gap-x-6 sm:grid-cols-2">
            {specs.map(([term, value]) => (
              <div key={term} className="border-t border-line py-3">
                <dt className="text-sm text-muted">{term}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="grid content-start gap-6">
          <section aria-labelledby="omschrijving" className="border border-line bg-surface p-5">
            <h2 id="omschrijving" className="font-display text-2xl">
              Omschrijving
            </h2>
            <p className="mt-3 leading-relaxed">{listing.description}</p>
            <h3 className="mt-5 text-sm font-semibold tracking-[0.14em] text-gold-deep uppercase">Uitrusting</h3>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {listing.equipment.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="car-pass" className="border border-gold bg-surface p-5">
            <h2 id="car-pass" className="font-display text-2xl">
              Car-Pass
            </h2>
            <p className="mt-3 leading-relaxed">
              Nog geen koppeling. We vragen niets op bij Car-Pass en tonen geen historiek of gecontroleerde
              kilometerstand. De kilometerstand hierboven komt alleen van de verkoper in deze seed.
            </p>
          </section>
          <section aria-labelledby="verkoper" className="border border-line bg-ink p-5 text-paper">
            <h2 id="verkoper" className="font-display text-2xl">
              {listing.sellerName}
            </h2>
            <p className="mt-2 text-sm text-gold">{sellerLabel[listing.sellerType]}</p>
            <p className="mt-3 leading-relaxed text-paper/80">
              {listing.postalCode} {listing.city}. Fictieve verkoper in de dealerseed. Er is geen telefoonnummer,
              geen live voorraad en geen afspraakmodule.
            </p>
          </section>
          <ContactForm listingId={listing.id} listingTitle={`${title} ${listing.version}`} />
        </div>
      </div>
    </article>
  );
}
