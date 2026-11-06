import Link from "next/link";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { ListingPhoto } from "@/components/listings/listing-photo";
import { formatEur, formatKm, formatRegistration, powerHp } from "@/lib/listings/format";
import { bodyLabel, fuelLabel, sellerLabel, transmissionLabel, vatLabel } from "@/lib/listings/labels";
import type { Listing } from "@/lib/listings/types";

export function ResultCard({ listing }: { listing: Listing }) {
  const title = `${listing.make} ${listing.model}`;
  const href = `/nl/autos/${listing.id}`;

  return (
    <article className="border border-line bg-surface">
      <div className="grid sm:grid-cols-[240px_minmax(0,1fr)]">
        <div className="relative border-b border-line sm:border-r sm:border-b-0">
          <Link href={href} className="block min-h-44 overflow-hidden">
            <ListingPhoto listing={listing} />
          </Link>
          <FavoriteButton id={listing.id} title={title} className="absolute top-3 right-3 bg-surface" />
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl leading-tight">
                <Link href={href} className="hover:text-gold-deep">
                  {title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-muted">{listing.version}</p>
            </div>
            <p className="text-right">
              <span className="block font-display text-2xl leading-none">{formatEur(listing.priceEur)}</span>
              <span className="mt-1 block text-xs font-semibold tracking-wide text-gold-deep uppercase">
                {vatLabel[listing.vatRegime]}
              </span>
            </p>
          </div>
          <p className="mt-4 text-sm leading-6">
            {formatRegistration(listing.firstRegistration)} · {formatKm(listing.mileageKm)} ·{" "}
            {fuelLabel[listing.fuel]} · {transmissionLabel[listing.transmission]}
          </p>
          <p className="text-sm leading-6 text-muted">
            {listing.powerKw} kW ({powerHp(listing.powerKw)} pk) · {bodyLabel[listing.body]} · {listing.color}
          </p>
          <p className="mt-3 text-sm">
            <span className="font-semibold">
              {listing.postalCode} {listing.city}
            </span>
            <span className="text-muted">
              {" "}
              · {listing.sellerName} · {sellerLabel[listing.sellerType]}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}
