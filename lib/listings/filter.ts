import { bodyLabel, fuelLabel, sellerLabel, transmissionLabel } from "@/lib/listings/labels";
import { formatCount, formatEur, formatKm, registrationYear } from "@/lib/listings/format";
import { toAutosHref } from "@/lib/listings/query";
import { emptyFilters, type Listing, type SearchFilters } from "@/lib/listings/types";

export type PostalPoint = {
  postalCode: string;
  city: string;
  lat: number;
  lng: number;
};

export type SearchSuggestion = {
  href: string;
  label: string;
  count: number;
};

export type SearchHit = {
  results: Listing[];
  unknownPostalCode: boolean;
  origin: PostalPoint | null;
  suggestions: SearchSuggestion[];
};

function haversineKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const startLat = toRadians(from.lat);
  const endLat = toRadians(to.lat);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

export function postalIndex(listings: readonly Listing[]) {
  const index = new Map<string, PostalPoint>();
  for (const listing of listings) {
    if (!index.has(listing.postalCode)) {
      index.set(listing.postalCode, {
        postalCode: listing.postalCode,
        city: listing.city,
        lat: listing.lat,
        lng: listing.lng,
      });
    }
  }
  return index;
}

export function filterListings(
  listings: readonly Listing[],
  filters: SearchFilters,
  postcodes: ReadonlyMap<string, PostalPoint>,
) {
  const origin = filters.postalCode ? (postcodes.get(filters.postalCode) ?? null) : null;
  const unknownPostalCode = Boolean(filters.postalCode) && !origin;
  const useRadius = Boolean(origin && filters.radiusKm !== null);

  const results = listings.filter((listing) => {
    if (filters.make && listing.make.toLowerCase() !== filters.make.toLowerCase()) return false;
    if (filters.model && listing.model.toLowerCase() !== filters.model.toLowerCase()) return false;
    if (filters.priceMin !== null && listing.priceEur < filters.priceMin) return false;
    if (filters.priceMax !== null && listing.priceEur > filters.priceMax) return false;
    if (filters.kmMax !== null && listing.mileageKm > filters.kmMax) return false;
    const year = registrationYear(listing.firstRegistration);
    if (filters.yearMin !== null && year < filters.yearMin) return false;
    if (filters.yearMax !== null && year > filters.yearMax) return false;
    if (filters.fuel && listing.fuel !== filters.fuel) return false;
    if (filters.transmission && listing.transmission !== filters.transmission) return false;
    if (filters.body && listing.body !== filters.body) return false;
    if (filters.seller && listing.sellerType !== filters.seller) return false;
    if (unknownPostalCode && filters.radiusKm !== null) return false;
    if (useRadius && origin && filters.radiusKm !== null) {
      if (haversineKm(origin, listing) > filters.radiusKm) return false;
    }
    return true;
  });

  return {
    results: results.toSorted((left, right) => left.priceEur - right.priceEur || left.id.localeCompare(right.id)),
    unknownPostalCode,
    origin,
  };
}

function suggestionLabel(name: string, count: number) {
  return `Zonder ${name}: ${formatCount(count)}`;
}

export function searchListings(
  listings: readonly Listing[],
  filters: SearchFilters,
  postcodes: ReadonlyMap<string, PostalPoint>,
): SearchHit {
  const current = filterListings(listings, filters, postcodes);
  if (current.results.length > 0) {
    return { ...current, suggestions: [] };
  }

  const relaxations: { name: string; next: SearchFilters }[] = [];
  if (filters.make) relaxations.push({ name: "merk", next: { ...filters, make: "", model: "" } });
  if (filters.model) relaxations.push({ name: "model", next: { ...filters, model: "" } });
  if (filters.priceMin !== null) relaxations.push({ name: "minimumprijs", next: { ...filters, priceMin: null } });
  if (filters.priceMax !== null) relaxations.push({ name: "maximumprijs", next: { ...filters, priceMax: null } });
  if (filters.kmMax !== null) relaxations.push({ name: "kilometergrens", next: { ...filters, kmMax: null } });
  if (filters.yearMin !== null) relaxations.push({ name: "jaar van", next: { ...filters, yearMin: null } });
  if (filters.yearMax !== null) relaxations.push({ name: "jaar tot", next: { ...filters, yearMax: null } });
  if (filters.fuel) relaxations.push({ name: "brandstof", next: { ...filters, fuel: "" } });
  if (filters.transmission) relaxations.push({ name: "transmissie", next: { ...filters, transmission: "" } });
  if (filters.body) relaxations.push({ name: "carrosserie", next: { ...filters, body: "" } });
  if (filters.postalCode || filters.radiusKm !== null) {
    relaxations.push({
      name: "postcode en straal",
      next: { ...filters, postalCode: "", radiusKm: null },
    });
  }
  if (filters.seller) relaxations.push({ name: "verkoper", next: { ...filters, seller: "" } });

  const suggestions = relaxations
    .map((item) => {
      const count = filterListings(listings, item.next, postcodes).results.length;
      return { href: toAutosHref(item.next), label: suggestionLabel(item.name, count), count };
    })
    .filter((item) => item.count > 0)
    .toSorted((left, right) => right.count - left.count)
    .slice(0, 4);

  return { ...current, suggestions };
}

export function activeChips(filters: SearchFilters) {
  const chips: { label: string; href: string }[] = [];
  const add = (label: string, next: SearchFilters) => chips.push({ label, href: toAutosHref(next) });
  if (filters.make) add(filters.make, { ...filters, make: "", model: "" });
  if (filters.model) add(filters.model, { ...filters, model: "" });
  if (filters.priceMin !== null) add(`vanaf ${formatEur(filters.priceMin)}`, { ...filters, priceMin: null });
  if (filters.priceMax !== null) add(`tot ${formatEur(filters.priceMax)}`, { ...filters, priceMax: null });
  if (filters.kmMax !== null) add(`tot ${formatKm(filters.kmMax)}`, { ...filters, kmMax: null });
  if (filters.yearMin !== null) add(`vanaf ${filters.yearMin}`, { ...filters, yearMin: null });
  if (filters.yearMax !== null) add(`tot ${filters.yearMax}`, { ...filters, yearMax: null });
  if (filters.fuel) add(fuelLabel[filters.fuel], { ...filters, fuel: "" });
  if (filters.transmission) add(transmissionLabel[filters.transmission], { ...filters, transmission: "" });
  if (filters.body) add(bodyLabel[filters.body], { ...filters, body: "" });
  if (filters.postalCode) add(filters.postalCode, { ...filters, postalCode: "", radiusKm: null });
  if (filters.radiusKm !== null) add(`${filters.radiusKm} km`, { ...filters, radiusKm: null });
  if (filters.seller) add(sellerLabel[filters.seller], { ...filters, seller: "" });
  return chips;
}

export function hasActiveFilters(filters: SearchFilters) {
  return toAutosHref(filters) !== toAutosHref(emptyFilters);
}
