import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import {
  favoritesStorageKey,
  leadsStorageKey,
  saveStoredLead,
  toggleStoredId,
  type BrowserStorage,
  type StoredLead,
} from "@/lib/listings/browser-store";
import { parseListingsCsv, serializeListings } from "@/lib/listings/csv";
import { searchListings } from "@/lib/listings/filter";
import { parseSearch, queriesMatch } from "@/lib/listings/query";
import { listings, postcodes } from "@/lib/listings/seed";
import { emptyFilters, type Listing } from "@/lib/listings/types";

const sampleLead: StoredLead = {
  listingId: "vw-golf-2019-antwerpen",
  listingTitle: "Volkswagen Golf 1.5 TSI Life",
  name: "Test",
  email: "test@example.com",
  phone: "",
  message: "Vraag over een fictieve wagen",
  savedAt: "2026-11-06T21:00:00.000Z",
};

describe("zoekfilters", () => {
  it("telt de volledige dealerseed en sorteert op prijs", () => {
    const result = searchListings(listings, emptyFilters, postcodes);
    assert.equal(result.results.length, 45);
    const prices = result.results.map((listing) => listing.priceEur);
    assert.deepEqual(prices, [...prices].sort((left, right) => left - right));
  });

  it("laat merk en model de telling dalen", () => {
    const volkswagen = searchListings(listings, { ...emptyFilters, make: "Volkswagen" }, postcodes);
    const golf = searchListings(
      listings,
      { ...emptyFilters, make: "Volkswagen", model: "Golf" },
      postcodes,
    );
    assert.equal(volkswagen.results.length, 6);
    assert.equal(golf.results.length, 2);
    assert.ok(golf.results.every((listing) => listing.model === "Golf"));
  });

  it("houdt een model zonder merk vast", () => {
    const golf = searchListings(listings, { ...emptyFilters, model: "Golf" }, postcodes);
    assert.equal(golf.results.length, 2);
  });

  it("beperkt postcode 2000 en 10 km tot Antwerpen", () => {
    const nearby = searchListings(
      listings,
      { ...emptyFilters, postalCode: "2000", radiusKm: 10 },
      postcodes,
    );
    assert.equal(nearby.results.length, 5);
    assert.ok(nearby.results.every((listing) => listing.city === "Antwerpen"));
    const wider = searchListings(
      listings,
      { ...emptyFilters, postalCode: "2000", radiusKm: 100 },
      postcodes,
    );
    assert.ok(wider.results.length > nearby.results.length);
  });

  it("geeft bij een onmogelijke prijs een voorstel met telling", () => {
    const empty = searchListings(
      listings,
      { ...emptyFilters, make: "Volkswagen", model: "Golf", priceMax: 1000 },
      postcodes,
    );
    assert.equal(empty.results.length, 0);
    assert.ok(empty.suggestions.some((item) => item.label.includes("Zonder maximumprijs: 2 auto's")));
  });

  it("negeert een negatieve prijs en meldt een onbekende straal", () => {
    const parsed = parseSearch({ prijsTot: "-1", straal: "15", postcode: "20" });
    assert.equal(parsed.filters.priceMax, null);
    assert.equal(parsed.filters.radiusKm, null);
    assert.equal(parsed.filters.postalCode, "");
    assert.ok(parsed.notices.some((notice) => notice.id === "straal"));
    assert.ok(parsed.notices.some((notice) => notice.id === "postcode"));
  });

  it("meldt een omgekeerde jaarband", () => {
    const parsed = parseSearch({ jaarVan: "2024", jaarTot: "2018" });
    assert.equal(parsed.notices[0]?.id, "jaar");
  });

  it("ziet plus en procentcodering als dezelfde zoek-URL", () => {
    assert.equal(
      queriesMatch("/nl/autos?model=1+Reeks", "/nl/autos?model=1%20Reeks"),
      true,
    );
    assert.equal(queriesMatch("/nl/autos?merk=Audi", "/nl/autos?merk=Volkswagen"), false);
  });
});

describe("csv", () => {
  it("leest het seedbestand terug naar dezelfde ids", () => {
    const csv = readFileSync(new URL("../../data/dealer-listings.csv", import.meta.url), "utf8");
    const parsed = parseListingsCsv(csv);
    assert.deepEqual(
      parsed.map((listing) => listing.id),
      listings.map((listing) => listing.id),
    );
    assert.equal(serializeListings(parsed), csv.replaceAll("\r\n", "\n"));
  });

  it("bewaart een komma in een geciteerde omschrijving", () => {
    const [first] = listings;
    const withComma: Listing = { ...first, description: "Fictief, met komma" };
    const parsed = parseListingsCsv(serializeListings([withComma]));
    assert.equal(parsed[0]?.description, "Fictief, met komma");
  });

  it("weigert een onbekende brandstof en een foute BTW-combinatie", () => {
    const csv = serializeListings(listings.slice(0, 1)).replace(",benzine,", ",waterstof,");
    assert.throws(() => parseListingsCsv(csv), /fuel/);
    const dealer = listings.find((listing) => listing.sellerType === "dealer");
    assert.ok(dealer);
    const badVat = serializeListings([{ ...dealer, vatRegime: "particulier" }]);
    assert.throws(() => parseListingsCsv(badVat), /BTW-regime/);
  });
});

describe("lokale opslag", () => {
  it("bewaart een lead niet wanneer de browser de schrijfactie weigert", () => {
    const storage = throwingStorage();
    const result = saveStoredLead(storage, leadsStorageKey, sampleLead);
    assert.deepEqual(result, { ok: false });
    assert.equal(storage.getItem(leadsStorageKey), "[]");
  });

  it("zet een favoriet niet wanneer de browser de schrijfactie weigert", () => {
    const storage = throwingStorage();
    const result = toggleStoredId(storage, favoritesStorageKey, sampleLead.listingId);
    assert.deepEqual(result, { ok: false });
  });
});

function throwingStorage(): BrowserStorage {
  const data = new Map<string, string>([
    [leadsStorageKey, "[]"],
    [favoritesStorageKey, "[]"],
  ]);
  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
}
