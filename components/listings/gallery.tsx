"use client";

import { useState } from "react";
import { ListingPhoto } from "@/components/listings/listing-photo";
import type { Listing } from "@/lib/listings/types";

const frameLabels = ["Zijaanzicht", "Driekwart", "Achterzijde", "Interieur"];

export function Gallery({ listing }: { listing: Listing }) {
  const [frame, setFrame] = useState(0);

  return (
    <div>
      <div className="overflow-hidden border border-line bg-surface">
        <ListingPhoto listing={listing} frame={frame} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {frameLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setFrame(index)}
            aria-current={frame === index}
            aria-label={`Toon ${label.toLowerCase()}`}
            className={`overflow-hidden border ${frame === index ? "border-gold" : "border-line"}`}
          >
            <ListingPhoto listing={listing} frame={index} />
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        Voorbeeldafbeeldingen op basis van kleur en carrosserie. Dit zijn geen foto&apos;s van deze wagen.
      </p>
    </div>
  );
}
