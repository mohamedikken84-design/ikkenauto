export const leadsStorageKey = "ikkenauto.leads";
export const favoritesStorageKey = "ikkenauto.favorieten";

export type BrowserStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type StoredLead = {
  listingId: string;
  listingTitle: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  savedAt: string;
};

export function readStringList(storage: BrowserStorage, key: string) {
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function readStoredLeads(storage: BrowserStorage, key: string): StoredLead[] {
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredLead);
  } catch {
    return [];
  }
}

export function toggleStoredId(
  storage: BrowserStorage,
  key: string,
  id: string,
): { ok: true; saved: boolean } | { ok: false } {
  const current = readStringList(storage, key);
  const saved = !current.includes(id);
  const next = saved ? [...current, id] : current.filter((item) => item !== id);
  try {
    storage.setItem(key, JSON.stringify(next));
    return { ok: true, saved };
  } catch {
    return { ok: false };
  }
}

export function saveStoredLead(
  storage: BrowserStorage,
  key: string,
  lead: StoredLead,
): { ok: true } | { ok: false } {
  const current = readStoredLeads(storage, key);
  try {
    storage.setItem(key, JSON.stringify([lead, ...current].slice(0, 20)));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function isStoredLead(value: unknown): value is StoredLead {
  if (!value || typeof value !== "object") return false;
  const lead = value as Partial<StoredLead>;
  return (
    typeof lead.listingId === "string" &&
    typeof lead.listingTitle === "string" &&
    typeof lead.name === "string" &&
    typeof lead.email === "string" &&
    typeof lead.phone === "string" &&
    typeof lead.message === "string" &&
    typeof lead.savedAt === "string"
  );
}
