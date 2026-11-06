export const FUELS = ["benzine", "diesel", "hybride", "elektrisch", "lpg"] as const;
export const TRANSMISSIONS = ["manueel", "automaat"] as const;
export const BODY_TYPES = [
  "berline",
  "break",
  "suv",
  "hatchback",
  "coupe",
  "cabrio",
  "monovolume",
] as const;
export const SELLER_TYPES = ["dealer", "particulier"] as const;
export const VAT_REGIMES = ["marge", "btw-aftrekbaar", "incl-btw", "particulier"] as const;
export const RADIUS_OPTIONS = [10, 25, 50, 100, 150, 200] as const;

export type Fuel = (typeof FUELS)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type BodyType = (typeof BODY_TYPES)[number];
export type SellerType = (typeof SELLER_TYPES)[number];
export type VatRegime = (typeof VAT_REGIMES)[number];

export type Listing = {
  id: string;
  make: string;
  model: string;
  version: string;
  priceEur: number;
  mileageKm: number;
  firstRegistration: string;
  fuel: Fuel;
  transmission: Transmission;
  body: BodyType;
  powerKw: number;
  color: string;
  doors: number;
  seats: number;
  co2Gkm: number;
  euroNorm: string;
  postalCode: string;
  city: string;
  lat: number;
  lng: number;
  sellerType: SellerType;
  sellerName: string;
  vatRegime: VatRegime;
  description: string;
  equipment: string[];
};

export type SearchFilters = {
  make: string;
  model: string;
  priceMin: number | null;
  priceMax: number | null;
  kmMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  fuel: Fuel | "";
  transmission: Transmission | "";
  body: BodyType | "";
  postalCode: string;
  radiusKm: number | null;
  seller: SellerType | "";
};

export const emptyFilters: SearchFilters = {
  make: "",
  model: "",
  priceMin: null,
  priceMax: null,
  kmMax: null,
  yearMin: null,
  yearMax: null,
  fuel: "",
  transmission: "",
  body: "",
  postalCode: "",
  radiusKm: null,
  seller: "",
};
