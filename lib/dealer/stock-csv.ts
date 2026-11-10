import { FUELS, TRANSMISSIONS, BODY_TYPES, VAT_REGIMES } from "@/lib/listings/types";

export type StockCsvRow = {
  lineNumber: number;
  sourceStockId: string;
  make: string;
  model: string;
  version: string;
  priceEur: number;
  mileageKm: number;
  firstRegistration: string;
  fuel: string;
  transmission: string;
  body: string;
  powerKw: number;
  postalCode: string;
  city: string;
  vatRegime: string;
  description: string;
  errors: string[];
};

const columns = [
  "source_stock_id",
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
  "postal_code",
  "city",
  "vat_regime",
  "description",
] as const;

function normalizeDelimiter(text: string) {
  const header = text.split(/\r?\n/, 1)[0] ?? "";
  if (header.includes(";") && !header.includes(",")) return text.replaceAll(";", ",");
  return text;
}

function parseTable(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else quoted = false;
      } else field += character;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") field += character;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function oneOf(value: string, allowed: readonly string[]) {
  return allowed.includes(value);
}

export function parseStockCsv(text: string): { fatal: string | null; rows: StockCsvRow[] } {
  const table = parseTable(normalizeDelimiter(text));
  if (table.length === 0) return { fatal: "Het bestand is leeg.", rows: [] };
  const header = table[0].map((cell) => cell.trim());
  const missing = columns.filter((column) => !header.includes(column));
  if (missing.length > 0) return { fatal: `Kolommen ontbreken: ${missing.join(", ")}`, rows: [] };
  const index = Object.fromEntries(header.map((column, position) => [column, position]));
  const seen = new Set<string>();
  const rows = table.slice(1).map((cells, offset) => {
    const read = (column: (typeof columns)[number]) => (cells[index[column]] ?? "").trim();
    const errors: string[] = [];
    const sourceStockId = read("source_stock_id");
    const price = Number(read("price_eur"));
    const mileage = Number(read("mileage_km"));
    const power = Number(read("power_kw"));
    const fuel = read("fuel");
    const transmission = read("transmission");
    const body = read("body");
    const vat = read("vat_regime");
    const registration = read("first_registration");
    if (!sourceStockId) errors.push("source_stock_id ontbreekt");
    if (sourceStockId && seen.has(sourceStockId)) errors.push("duplicaat in dit bestand");
    if (sourceStockId) seen.add(sourceStockId);
    if (!read("make") || !read("model")) errors.push("merk en model zijn verplicht");
    if (!Number.isInteger(price) || price <= 0) errors.push("prijs is ongeldig");
    if (!Number.isInteger(mileage) || mileage < 0) errors.push("kilometerstand is ongeldig");
    if (!Number.isInteger(power) || power <= 0) errors.push("vermogen is ongeldig");
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(registration)) errors.push("eerste inschrijving is ongeldig");
    if (!oneOf(fuel, FUELS)) errors.push("brandstof is ongeldig");
    if (!oneOf(transmission, TRANSMISSIONS)) errors.push("transmissie is ongeldig");
    if (!oneOf(body, BODY_TYPES)) errors.push("carrosserie is ongeldig");
    if (!oneOf(vat, VAT_REGIMES)) errors.push("btw-regime is ongeldig");
    if (!/^\d{4}$/.test(read("postal_code"))) errors.push("postcode is ongeldig");
    return {
      lineNumber: offset + 2,
      sourceStockId,
      make: read("make"),
      model: read("model"),
      version: read("version"),
      priceEur: price,
      mileageKm: mileage,
      firstRegistration: registration,
      fuel,
      transmission,
      body,
      powerKw: power,
      postalCode: read("postal_code"),
      city: read("city"),
      vatRegime: vat,
      description: read("description"),
      errors,
    };
  });
  if (rows.length === 0) return { fatal: "Het bestand bevat geen voorraadregels.", rows: [] };
  return { fatal: null, rows };
}
