import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHomeSearch, resolveHomeModel } from "@/lib/listings/home-search";

const modelsByMake = {
  Volkswagen: ["Golf", "Polo"],
  Audi: ["A3"],
};

describe("homepage-zoekblok", () => {
  it("zet merk om en wist een model dat niet bij het nieuwe merk hoort", () => {
    assert.equal(resolveHomeModel("Audi", "Golf", modelsByMake), "");
    assert.equal(resolveHomeModel("Volkswagen", "Golf", modelsByMake), "Golf");
    assert.equal(resolveHomeModel("", "Golf", modelsByMake), "");
  });

  it("bouwt de bestaande filter-URL en laat lege velden weg", () => {
    const result = buildHomeSearch(
      {
        make: "Volkswagen",
        model: "Golf",
        price: "15.000",
        year: "2019",
        postalCode: "2000",
        radius: "25",
      },
      ["2000", "9000"],
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(
        result.href,
        "/nl/autos?merk=Volkswagen&model=Golf&prijsTot=15000&jaarVan=2019&postcode=2000&straal=25",
      );
    }
  });

  it("weigert een ongeldige prijs en een onbekende postcode", () => {
    const price = buildHomeSearch(
      { make: "", model: "", price: "goedkoop", year: "", postalCode: "", radius: "" },
      ["2000"],
    );
    assert.equal(price.ok, false);
    const postcode = buildHomeSearch(
      { make: "", model: "", price: "", year: "", postalCode: "9999", radius: "10" },
      ["2000"],
    );
    assert.equal(postcode.ok, false);
    if (!postcode.ok) assert.equal(postcode.error.field, "postcode");
  });

  it("neemt geen straal mee zonder postcode", () => {
    const result = buildHomeSearch(
      { make: "Audi", model: "", price: "", year: "", postalCode: "", radius: "10" },
      ["2000"],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.href, "/nl/autos?merk=Audi");
  });
});
