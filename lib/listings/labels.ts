import type { BodyType, Fuel, SellerType, Transmission, VatRegime } from "@/lib/listings/types";

export const fuelLabel: Record<Fuel, string> = {
  benzine: "Benzine",
  diesel: "Diesel",
  hybride: "Hybride",
  elektrisch: "Elektrisch",
  lpg: "LPG",
};

export const transmissionLabel: Record<Transmission, string> = {
  manueel: "Manueel",
  automaat: "Automaat",
};

export const bodyLabel: Record<BodyType, string> = {
  berline: "Berline",
  break: "Break",
  suv: "SUV",
  hatchback: "Hatchback",
  coupe: "Coupé",
  cabrio: "Cabrio",
  monovolume: "Monovolume",
};

export const sellerLabel: Record<SellerType, string> = {
  dealer: "Dealer",
  particulier: "Particulier",
};

export const vatLabel: Record<VatRegime, string> = {
  marge: "Marge",
  "btw-aftrekbaar": "BTW aftrekbaar",
  "incl-btw": "Incl. BTW",
  particulier: "Particuliere verkoop",
};

export const vatDetail: Record<VatRegime, string> = {
  marge: "Margeregeling. De prijs is niet als BTW-aftrekbaar aangegeven.",
  "btw-aftrekbaar": "De verkoper geeft deze wagen aan als BTW-aftrekbaar.",
  "incl-btw": "Prijs inclusief BTW, volgens de verkoper.",
  particulier: "Verkoop tussen particulieren. Geen BTW van toepassing in deze seed.",
};
