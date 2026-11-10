export type PortalLocale = "nl" | "fr";

const publication: Record<string, Record<PortalLocale, string>> = {
  draft: { nl: "Concept", fr: "Brouillon" },
  published: { nl: "Klaar voor lancering", fr: "Prêt pour le lancement" },
  paused: { nl: "Gepauzeerd", fr: "En pause" },
  sold: { nl: "Verkocht", fr: "Vendu" },
  archived: { nl: "Gearchiveerd", fr: "Archivé" },
};

const verification: Record<string, Record<PortalLocale, string>> = {
  unverified: { nl: "Account bevestigd", fr: "Compte confirmé" },
  pending_review: { nl: "In behandeling", fr: "En cours d'examen" },
  verified: { nl: "Geverifieerd", fr: "Vérifié" },
  needs_info: { nl: "Aanvulling nodig", fr: "Complément nécessaire" },
  rejected: { nl: "Geweigerd", fr: "Refusé" },
};

export function publicationLabel(status: string, locale: PortalLocale = "nl") {
  return publication[status]?.[locale] ?? status;
}

export function verificationLabel(status: string, locale: PortalLocale = "nl") {
  return verification[status]?.[locale] ?? status;
}
