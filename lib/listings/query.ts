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
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("-")) return null;
  const cleaned = trimmed.replace(/[^\d]/g, "");
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

export type SearchNotice = {
  id: string;
  text: string;
};

export function parseSearch(
  input: Record<string, QueryValue>,
  options?: { makes?: readonly string[]; models?: readonly string[] },
): { filters: SearchFilters; notices: SearchNotice[] } {
  const notices: SearchNotice[] = [];
  const year = (value: string) => {
    const parsed = digits(value);
    if (parsed === null || parsed < 1995 || parsed > 2026) return null;
    return parsed;
  };
  const rawRadius = first(input.straal);
  const radius = digits(rawRadius);
  const rawPostcode = first(input.postcode);
  const rawFuel = first(input.brandstof);
  const priceMin = digits(first(input.prijsVan));
  const priceMax = digits(first(input.prijsTot) || first(input.prijs));
  const yearMin = year(first(input.jaarVan));
  const yearMax = year(first(input.jaarTot));
  const radiusKm = radius !== null && (RADIUS_OPTIONS as readonly number[]).includes(radius) ? radius : null;

  if (rawRadius && radiusKm === null) {
    notices.push({
      id: "straal",
      text: `Straal '${rawRadius}' hoort niet bij de keuzes. De afstand is niet beperkt.`,
    });
  }
  if (rawPostcode && !/^\d{4}$/.test(rawPostcode)) {
    notices.push({
      id: "postcode",
      text: `Postcode '${rawPostcode}' is geen postcode van 4 cijfers. Die locatie is niet gebruikt.`,
    });
  }
  if (rawFuel && !oneOf<Fuel>(rawFuel, FUELS)) {
    notices.push({
      id: "brandstof",
      text: `Brandstof '${rawFuel}' kennen we niet. Dat filter is niet toegepast.`,
    });
  }
  if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
    notices.push({
      id: "prijs",
      text: "Prijs van ligt boven prijs tot. Daardoor is de telling 0.",
    });
  }
  if (yearMin !== null && yearMax !== null && yearMin > yearMax) {
    notices.push({
      id: "jaar",
      text: "Jaar van ligt na jaar tot. Daardoor is de telling 0.",
    });
  }

  return {
    filters: {
      make: matchOption(first(input.merk), options?.makes ?? []),
      model: matchOption(first(input.model), options?.models ?? []),
      priceMin,
      priceMax,
      kmMax: digits(first(input.kmTot)),
      yearMin,
      yearMax,
      fuel: oneOf<Fuel>(rawFuel, FUELS),
      transmission: oneOf<Transmission>(first(input.transmissie), TRANSMISSIONS),
      body: oneOf<BodyType>(first(input.carrosserie), BODY_TYPES),
      postalCode: /^\d{4}$/.test(rawPostcode) ? rawPostcode : "",
      radiusKm,
      seller: oneOf<SellerType>(first(input.verkoper), SELLER_TYPES),
    },
    notices,
  };
}

export function parseFilters(
  input: Record<string, QueryValue>,
  options?: { makes?: readonly string[]; models?: readonly string[] },
): SearchFilters {
  return parseSearch(input, options).filters;
}

export function queriesMatch(left: string, right: string) {
  const leftUrl = new URL(left, "https://ikkenauto.be");
  const rightUrl = new URL(right, "https://ikkenauto.be");
  if (leftUrl.pathname !== rightUrl.pathname) return false;
  const leftParams = new URLSearchParams(leftUrl.search);
  const rightParams = new URLSearchParams(rightUrl.search);
  const keys = new Set([...leftParams.keys(), ...rightParams.keys()]);
  for (const key of keys) {
    if (leftParams.get(key) !== rightParams.get(key)) return false;
  }
  return true;
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

