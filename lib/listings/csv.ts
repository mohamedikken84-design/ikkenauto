import {
  BODY_TYPES,
  FUELS,
  SELLER_TYPES,
  TRANSMISSIONS,
  VAT_REGIMES,
  type BodyType,
  type Fuel,
  type Listing,
  type SellerType,
  type Transmission,
  type VatRegime,
} from "@/lib/listings/types";

export const CSV_COLUMNS = [
  "id",
  "make",
  "model",
  "version",
  "price_eur",
  "mileage_km",
  "first_registration",
  "fuel",
  "transmission",
  "body",
  "power_kw",
  "color",
  "doors",
  "seats",
  "co2_gkm",
  "euro_norm",
  "postal_code",
  "city",
  "lat",
  "lng",
  "seller_type",
  "seller_name",
  "vat_regime",
  "description",
  "equipment",
] as const;

const columnIndex = Object.fromEntries(CSV_COLUMNS.map((column, index) => [column, index]));

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

function parseCsvTable(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function escapeCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function cell(row: string[], column: (typeof CSV_COLUMNS)[number], line: number) {
  const value = row[columnIndex[column]];
  if (value === undefined) {
    throw new Error(`CSV regel ${line}: kolom ${column} ontbreekt.`);
  }
  return value.trim();
}

function requireText(value: string, line: number, column: string) {
  if (!value) {
    throw new Error(`CSV regel ${line}: ${column} is leeg.`);
  }
  return value;
}

function requireInt(value: string, line: number, column: string, min: number) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`CSV regel ${line}: ${column} moet een geheel getal zijn.`);
  }
  const parsed = Number(value);
  if (parsed < min) {
    throw new Error(`CSV regel ${line}: ${column} is te klein.`);
  }
  return parsed;
}

function requireEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  line: number,
  column: string,
): T {
  if (!isOneOf(value, allowed)) {
    throw new Error(`CSV regel ${line}: ${column} '${value}' is geen geldige waarde.`);
  }
  return value;
}

export function serializeListings(listings: readonly Listing[]) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const listing of listings) {
    const record: Record<(typeof CSV_COLUMNS)[number], string> = {
      id: listing.id,
      make: listing.make,
      model: listing.model,
      version: listing.version,
      price_eur: String(listing.priceEur),
      mileage_km: String(listing.mileageKm),
      first_registration: listing.firstRegistration,
      fuel: listing.fuel,
      transmission: listing.transmission,
      body: listing.body,
      power_kw: String(listing.powerKw),
      color: listing.color,
      doors: String(listing.doors),
      seats: String(listing.seats),
      co2_gkm: String(listing.co2Gkm),
      euro_norm: listing.euroNorm,
      postal_code: listing.postalCode,
      city: listing.city,
      lat: listing.lat.toFixed(5),
      lng: listing.lng.toFixed(5),
      seller_type: listing.sellerType,
      seller_name: listing.sellerName,
      vat_regime: listing.vatRegime,
      description: listing.description,
      equipment: listing.equipment.join("|"),
    };
    lines.push(CSV_COLUMNS.map((column) => escapeCell(record[column])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function parseListingsCsv(text: string): Listing[] {
  const rows = parseCsvTable(text);
  if (rows.length < 2) {
    throw new Error("CSV bevat geen advertenties.");
  }
  const header = rows[0].map((column) => column.trim());
  if (header.join(",") !== CSV_COLUMNS.join(",")) {
    throw new Error(`CSV-hoofding moet exact deze kolommen hebben: ${CSV_COLUMNS.join(",")}`);
  }

  return rows.slice(1).map((row, index) => {
    const line = index + 2;
    if (row.length !== CSV_COLUMNS.length) {
      throw new Error(`CSV regel ${line}: verwacht ${CSV_COLUMNS.length} kolommen, kreeg ${row.length}.`);
    }

    const id = requireText(cell(row, "id", line), line, "id");
    if (!/^[a-z0-9-]+$/.test(id)) {
      throw new Error(`CSV regel ${line}: id mag alleen kleine letters, cijfers en koppeltekens bevatten.`);
    }
    const firstRegistration = requireText(cell(row, "first_registration", line), line, "first_registration");
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(firstRegistration)) {
      throw new Error(`CSV regel ${line}: first_registration moet YYYY-MM zijn.`);
    }
    const year = Number(firstRegistration.slice(0, 4));
    if (year < 1995 || year > 2026) {
      throw new Error(`CSV regel ${line}: inschrijvingsjaar valt buiten 1995-2026.`);
    }

    const postalCode = cell(row, "postal_code", line);
    if (!/^\d{4}$/.test(postalCode)) {
      throw new Error(`CSV regel ${line}: postal_code moet 4 cijfers zijn.`);
    }

    const lat = Number(cell(row, "lat", line));
    const lng = Number(cell(row, "lng", line));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 49 || lat > 52 || lng < 2 || lng > 7) {
      throw new Error(`CSV regel ${line}: coördinaten liggen niet in België.`);
    }

    const fuel = requireEnum(cell(row, "fuel", line), FUELS, line, "fuel");
    const transmission = requireEnum(cell(row, "transmission", line), TRANSMISSIONS, line, "transmission");
    const body = requireEnum(cell(row, "body", line), BODY_TYPES, line, "body");
    const sellerType = requireEnum(cell(row, "seller_type", line), SELLER_TYPES, line, "seller_type");
    const vatRegime = requireEnum(cell(row, "vat_regime", line), VAT_REGIMES, line, "vat_regime");
    const equipment = cell(row, "equipment", line)
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
    if (equipment.length === 0) {
      throw new Error(`CSV regel ${line}: equipment is leeg.`);
    }

    const listing: Listing = {
      id,
      make: requireText(cell(row, "make", line), line, "make"),
      model: requireText(cell(row, "model", line), line, "model"),
      version: requireText(cell(row, "version", line), line, "version"),
      priceEur: requireInt(cell(row, "price_eur", line), line, "price_eur", 500),
      mileageKm: requireInt(cell(row, "mileage_km", line), line, "mileage_km", 0),
      firstRegistration,
      fuel: fuel as Fuel,
      transmission: transmission as Transmission,
      body: body as BodyType,
      powerKw: requireInt(cell(row, "power_kw", line), line, "power_kw", 30),
      color: requireText(cell(row, "color", line), line, "color"),
      doors: requireInt(cell(row, "doors", line), line, "doors", 2),
      seats: requireInt(cell(row, "seats", line), line, "seats", 2),
      co2Gkm: requireInt(cell(row, "co2_gkm", line), line, "co2_gkm", 0),
      euroNorm: requireText(cell(row, "euro_norm", line), line, "euro_norm"),
      postalCode,
      city: requireText(cell(row, "city", line), line, "city"),
      lat,
      lng,
      sellerType: sellerType as SellerType,
      sellerName: requireText(cell(row, "seller_name", line), line, "seller_name"),
      vatRegime: vatRegime as VatRegime,
      description: requireText(cell(row, "description", line), line, "description"),
      equipment,
    };

    if (listing.sellerType === "particulier" && listing.vatRegime !== "particulier") {
      throw new Error(`CSV regel ${line}: een particulier gebruikt het BTW-regime 'particulier'.`);
    }
    if (listing.sellerType === "dealer" && listing.vatRegime === "particulier") {
      throw new Error(`CSV regel ${line}: een dealer gebruikt geen particulier BTW-regime.`);
    }
    return listing;
  });
}
