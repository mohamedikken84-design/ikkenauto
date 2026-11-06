/**
 * Nederlandstalige sitegegevens voor IKKENAUTO.be.
 * Franse copy komt later; nieuwe tekst blijft Nederlands en hergebruikte labels staan hier.
 */

export const site = {
  name: "IKKENAUTO",
  domainLabel: "IKKENAUTO.be",
  url: "https://ikkenauto.be",
  title: "IKKENAUTO.be — Automarktplaats in België",
  description:
    "Zoek straks een auto in België op merk, model en prijs. IKKENAUTO.be wordt de marktplaats voor particulieren en handelaars, en is nog in opbouw.",
} as const;

export const primaryNav = [
  { href: "/zoeken", label: "Zoeken" },
  { href: "/plaats-advertentie", label: "Plaats advertentie" },
  { href: "/berichten", label: "Berichten" },
  { href: "/account", label: "Account" },
] as const;

export const legalNav = [
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/voorwaarden", label: "Voorwaarden" },
] as const;

export const sitemapRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/zoeken", priority: 0.8, changeFrequency: "weekly" },
  { path: "/plaats-advertentie", priority: 0.8, changeFrequency: "monthly" },
  { path: "/handelaars", priority: 0.6, changeFrequency: "monthly" },
  { path: "/berichten", priority: 0.4, changeFrequency: "monthly" },
  { path: "/account", priority: 0.4, changeFrequency: "monthly" },
] as const;
