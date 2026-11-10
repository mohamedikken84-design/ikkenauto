import type { MetadataRoute } from "next";
import { indexingClosed } from "@/lib/indexing";
import { site } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (await indexingClosed()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
