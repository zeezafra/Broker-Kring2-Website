import type { MetadataRoute } from "next";
import type { ApiProperty } from "@/lib/public-api";
import { sellPage } from "@/lib/sell";
import { absoluteUrl } from "@/lib/site";

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Every public listing, 100 per request (the API's maximum). Sample/placeholder listings are left out so they
// are not indexed as real inventory. If the API is down the sitemap still lists the fixed pages.
async function allListings(): Promise<ApiProperty[]> {
  const out: ApiProperty[] = [];
  try {
    for (let offset = 0; offset < 2000; offset += 100) {
      const res = await fetch(`${API_BASE}/api/properties?limit=100&offset=${offset}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) break;
      const body = (await res.json()) as { data?: ApiProperty[]; total?: number };
      if (!Array.isArray(body.data) || body.data.length === 0) break;
      out.push(...body.data);
      if (out.length >= (body.total ?? 0)) break;
    }
  } catch {
    // fall through with whatever was collected
  }
  return out.filter((p) => !p.isPlaceholder);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["/", "/properties", "/about", "/contact", ...(sellPage.approved ? ["/sell"] : [])];
  const listings = await allListings();
  return [
    ...pages.map((path) => ({ url: absoluteUrl(path) })),
    ...listings.map((p) => ({ url: absoluteUrl(`/properties/${p.id}`), lastModified: new Date(p.updatedAt) })),
  ];
}
