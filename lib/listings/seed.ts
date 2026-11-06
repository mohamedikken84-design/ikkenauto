import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parseListingsCsv, serializeListings } from "@/lib/listings/csv";
import { searchListings, postalIndex } from "@/lib/listings/filter";
import { seedListings } from "@/lib/listings/seed-data";
import { emptyFilters, type Listing } from "@/lib/listings/types";

const csvPath = path.join(process.cwd(), "data", "dealer-listings.csv");
const generatedCsv = serializeListings(seedListings);

if (process.env.UPDATE_SEED_CSV === "1") {
  mkdirSync(path.dirname(csvPath), { recursive: true });
  writeFileSync(csvPath, generatedCsv);
}

const csvOnDisk = readFileSync(csvPath, "utf8");
if (csvOnDisk.replaceAll("\r\n", "\n") !== generatedCsv) {
  throw new Error(
    "data/dealer-listings.csv wijkt af van de typed seed. Draai UPDATE_SEED_CSV=1 om het bestand te vernieuwen.",
  );
}

export const listings: Listing[] = parseListingsCsv(csvOnDisk);
export const postcodes = postalIndex(listings);

const dealers = listings.filter((listing) => listing.sellerType === "dealer");
const privateSellers = listings.filter((listing) => listing.sellerType === "particulier");
if (listings.length < 30) {
  throw new Error("De dealerseed moet minstens 30 advertenties bevatten.");
}
if (dealers.length <= privateSellers.length) {
  throw new Error("De seed moet dealer-first zijn.");
}
if (new Set(listings.map((listing) => listing.id)).size !== listings.length) {
  throw new Error("Advertentie-ids moeten uniek zijn.");
}

const volkswagen = searchListings(listings, { ...emptyFilters, make: "Volkswagen" }, postcodes);
const golf = searchListings(
  listings,
  { ...emptyFilters, make: "Volkswagen", model: "Golf" },
  postcodes,
);
if (golf.results.length === 0 || golf.results.length >= volkswagen.results.length) {
  throw new Error("Merk en model filteren niet zoals verwacht.");
}

const nearAntwerp = searchListings(
  listings,
  { ...emptyFilters, postalCode: "2000", radiusKm: 10 },
  postcodes,
);
if (nearAntwerp.results.length === 0 || nearAntwerp.results.some((listing) => listing.city !== "Antwerpen")) {
  throw new Error("Straal rond 2000 moet alleen Antwerpen opleveren.");
}
const wider = searchListings(
  listings,
  { ...emptyFilters, postalCode: "2000", radiusKm: 100 },
  postcodes,
);
if (wider.results.length <= nearAntwerp.results.length) {
  throw new Error("Een grotere straal moet meer auto's opleveren.");
}

const impossible = searchListings(
  listings,
  { ...emptyFilters, make: "Volkswagen", model: "Golf", priceMax: 1000 },
  postcodes,
);
if (impossible.results.length !== 0 || impossible.suggestions.length === 0) {
  throw new Error("Een lege resultaatset moet een voorstel tonen om filters te versoepelen.");
}

export function getListing(id: string) {
  return listings.find((listing) => listing.id === id);
}

export function modelsByMake() {
  const grouped = new Map<string, Set<string>>();
  for (const listing of listings) {
    const models = grouped.get(listing.make) ?? new Set<string>();
    models.add(listing.model);
    grouped.set(listing.make, models);
  }
  return Object.fromEntries(
    [...grouped.entries()]
      .toSorted(([left], [right]) => left.localeCompare(right, "nl"))
      .map(([make, models]) => [make, [...models].toSorted((left, right) => left.localeCompare(right, "nl"))]),
  );
}

export function knownPostcodes() {
  return [...postcodes.values()].toSorted((left, right) => left.postalCode.localeCompare(right.postalCode));
}
