import type { MetadataRoute } from "next";
import { listings } from "@/lib/listings/seed";
import { site, sitemapRoutes } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = sitemapRoutes.map((route) => ({
    url: `${site.url}${route.path === "/" ? "" : route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  const adverts = listings.map((listing) => ({
    url: `${site.url}/nl/autos/${listing.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
  return [...pages, ...adverts];
}
