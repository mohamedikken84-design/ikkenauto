import {
  BODY_TYPES,
  FUELS,
  RADIUS_OPTIONS,
  SELLER_TYPES,
  TRANSMISSIONS,
  type BodyType,
  type Fuel,
  type SearchFilters,
  type SellerType,
  type Transmission,
} from "@/lib/listings/types";

type QueryValue = string | string[] | undefined;

function first(value: QueryValue) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

function digits(value: string) {
  const cleaned = value.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | "" {
  return (allowed as readonly string[]).includes(value) ? (value as T) : "";
}

function matchOption(value: string, options: readonly string[]) {
  if (!value) return "";
  return options.find((option) => option.toLowerCase() === value.toLowerCase()) ?? value;
}

export function parseFilters(
  input: Record<string, QueryValue>,
  options?: { makes?: readonly string[]; models?: readonly string[] },
): SearchFilters {
  const year = (value: string) => {
    const parsed = digits(value);
    if (parsed === null || parsed < 1995 || parsed > 2026) return null;
    return parsed;
  };
  const radius = digits(first(input.straal));
  const priceMax = digits(first(input.prijsTot) || first(input.prijs));

  return {
    make: matchOption(first(input.merk), options?.makes ?? []),
    model: matchOption(first(input.model), options?.models ?? []),
    priceMin: digits(first(input.prijsVan)),
    priceMax,
    kmMax: digits(first(input.kmTot)),
    yearMin: year(first(input.jaarVan)),
    yearMax: year(first(input.jaarTot)),
    fuel: oneOf<Fuel>(first(input.brandstof), FUELS),
    transmission: oneOf<Transmission>(first(input.transmissie), TRANSMISSIONS),
    body: oneOf<BodyType>(first(input.carrosserie), BODY_TYPES),
    postalCode: /^\d{4}$/.test(first(input.postcode)) ? first(input.postcode) : "",
    radiusKm: radius !== null && (RADIUS_OPTIONS as readonly number[]).includes(radius) ? radius : null,
    seller: oneOf<SellerType>(first(input.verkoper), SELLER_TYPES),
  };
}

export function toSearchParams(filters: SearchFilters) {
  const params = new URLSearchParams();
  if (filters.make) params.set("merk", filters.make);
  if (filters.model) params.set("model", filters.model);
  if (filters.priceMin !== null) params.set("prijsVan", String(filters.priceMin));
  if (filters.priceMax !== null) params.set("prijsTot", String(filters.priceMax));
  if (filters.kmMax !== null) params.set("kmTot", String(filters.kmMax));
  if (filters.yearMin !== null) params.set("jaarVan", String(filters.yearMin));
  if (filters.yearMax !== null) params.set("jaarTot", String(filters.yearMax));
  if (filters.fuel) params.set("brandstof", filters.fuel);
  if (filters.transmission) params.set("transmissie", filters.transmission);
  if (filters.body) params.set("carrosserie", filters.body);
  if (filters.postalCode) params.set("postcode", filters.postalCode);
  if (filters.radiusKm !== null) params.set("straal", String(filters.radiusKm));
  if (filters.seller) params.set("verkoper", filters.seller);
  return params;
}

export function toAutosHref(filters: SearchFilters) {
  const params = toSearchParams(filters);
  const query = params.toString();
  return query ? `/nl/autos?${query}` : "/nl/autos";
}

