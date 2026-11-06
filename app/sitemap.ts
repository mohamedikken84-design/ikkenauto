import type { MetadataRoute } from "next";
import { site, sitemapRoutes } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapRoutes.map((route) => ({
    url: `${site.url}${route.path === "/" ? "" : route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
