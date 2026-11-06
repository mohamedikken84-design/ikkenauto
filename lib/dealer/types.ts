export const dealerRoles = ["platform_admin", "dealer_admin", "dealer_staff"] as const;
export type DealerRole = (typeof dealerRoles)[number];

export const publicationStatuses = ["draft", "published", "paused", "sold"] as const;
export type PublicationStatus = (typeof publicationStatuses)[number];

export type Actor = {
  userId: string;
  role: DealerRole;
  dealerId: string | null;
  email: string;
};

export type VehicleRecord = {
  id: string;
  dealerId: string;
  sourceSystem: string;
  sourceStockId: string;
  fictional: boolean;
  provenance: string;
  sourceRights: "dealer-owned" | "imported-by-dealer" | "dev-fictional";
  publicationStatus: PublicationStatus;
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
};

export type StockInput = {
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
};
