import { RADIUS_OPTIONS } from "@/lib/listings/types";

export const homeSearchYears = Array.from({ length: 11 }, (_, index) => 2026 - index);

export type HomeSearchInput = {
  make: string;
  model: string;
  price: string;
  year: string;
  postalCode: string;
  radius: string;
};

export type HomeSearchError = {
  field: "prijsTot" | "postcode" | "straal";
  message: string;
};

export function resolveHomeModel(
  make: string,
  model: string,
  modelsByMake: Record<string, readonly string[]>,
) {
  if (!make) return "";
  return (modelsByMake[make] ?? []).includes(model) ? model : "";
}

export function buildHomeSearch(
  input: HomeSearchInput,
  knownPostcodes: readonly string[],
): { ok: true; href: string } | { ok: false; error: HomeSearchError } {
  const params = new URLSearchParams();
  if (input.make) params.set("merk", input.make);
  if (input.make && input.model) params.set("model", input.model);

  const price = input.price.trim();
  if (price) {
    if (price.includes("-") || !/^[\d.\s]+$/.test(price)) {
      return {
        ok: false,
        error: { field: "prijsTot", message: "Prijs tot moet een bedrag zijn, bijvoorbeeld 15.000." },
      };
    }
    const amount = Number(price.replace(/[^\d]/g, ""));
    if (!Number.isInteger(amount) || amount <= 0) {
      return {
        ok: false,
        error: { field: "prijsTot", message: "Prijs tot moet groter zijn dan 0." },
      };
    }
    params.set("prijsTot", String(amount));
  }

  if (input.year && homeSearchYears.includes(Number(input.year))) {
    params.set("jaarVan", input.year);
  }

  if (input.postalCode) {
    if (!knownPostcodes.includes(input.postalCode)) {
      return {
        ok: false,
        error: {
          field: "postcode",
          message: "Kies een postcode uit de voorbeeldcatalogus. Er wordt geen locatie geraden.",
        },
      };
    }
    params.set("postcode", input.postalCode);
    if (input.radius) {
      if (!(RADIUS_OPTIONS as readonly number[]).includes(Number(input.radius))) {
        return {
          ok: false,
          error: { field: "straal", message: "Kies een straal uit de lijst." },
        };
      }
      params.set("straal", input.radius);
    }
  }

  const query = params.toString();
  return { ok: true, href: query ? `/nl/autos?${query}` : "/nl/autos" };
}
