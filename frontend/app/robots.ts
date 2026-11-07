import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Admin, API and the setup check page are never for search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/status"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
