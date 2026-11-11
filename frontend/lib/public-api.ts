import type { AdminProperty, PropertyStatus } from "./admin-api";
import { toApiParams, type ListingFilter, type SearchState } from "./search";

// Server-side reads of the PUBLIC listings API (drafts are never returned by it).
// API_URL is the Render URL on Vercel; the NEXT_PUBLIC fallback and localhost keep local dev working.
const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ApiProperty = AdminProperty;

// How many cards the home page shows (the design is a row of three).
export const HOME_FEATURED_LIMIT = 3;

export type FeaturedResult = { ok: true; data: ApiProperty[] } | { ok: false };

export async function getFeaturedProperties(): Promise<FeaturedResult> {
  try {
    const res = await fetch(`${API_BASE}/api/properties?featured=true&limit=${HOME_FEATURED_LIMIT}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false };
    const body = (await res.json()) as { data?: ApiProperty[] };
    return Array.isArray(body.data) ? { ok: true, data: body.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export function formatPrice(p: Pick<ApiProperty, "price" | "listingType">): string {
  const amount = `₱${p.price.toLocaleString("en-PH")}`;
  return p.listingType === "RENT" ? `${amount} / mo` : amount;
}

// Cloudinary can resize and compress on the fly: insert width + auto format/quality after /upload/.
// Other hosts (the Unsplash placeholder photos) are returned unchanged.
export function cardImage(url: string, width = 800): string {
  const marker = "https://res.cloudinary.com/";
  if (!url.startsWith(marker) || !url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
}

export function formatArea(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ---- Phase 7: full listings grid + detail page ----

// 3 columns x 3 rows on desktop.
export const PAGE_SIZE = 9;

// ?listing=buy|rent on /properties. Defined in lib/search.ts with the other Phase 8 URL helpers.
export type { ListingFilter };

export type ListResult =
  | { ok: true; data: ApiProperty[]; total: number; limit: number; offset: number }
  | { ok: false };

// Phase 8: the page's parsed URL state (listing tab, search words, filters, sort, page) goes straight to the API.
export async function getProperties(state: SearchState): Promise<ListResult> {
  const qs = toApiParams(state, PAGE_SIZE);
  try {
    const res = await fetch(`${API_BASE}/api/properties?${qs}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false };
    const body = (await res.json()) as { data?: ApiProperty[]; total?: number; limit?: number; offset?: number };
    if (!Array.isArray(body.data) || typeof body.total !== "number") return { ok: false };
    return { ok: true, data: body.data, total: body.total, limit: body.limit ?? PAGE_SIZE, offset: body.offset ?? 0 };
  } catch {
    return { ok: false };
  }
}

// notFound distinguishes "this listing does not exist (or is a draft)" from "the API is unreachable".
export type PropertyResult = { ok: true; data: ApiProperty } | { ok: false; notFound: boolean };

export async function getProperty(id: string): Promise<PropertyResult> {
  if (!/^\d+$/.test(id)) return { ok: false, notFound: true };
  try {
    const res = await fetch(`${API_BASE}/api/properties/${id}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return { ok: false, notFound: true };
    if (!res.ok) return { ok: false, notFound: false };
    const body = (await res.json()) as { data?: ApiProperty };
    return body.data ? { ok: true, data: body.data } : { ok: false, notFound: false };
  } catch {
    return { ok: false, notFound: false };
  }
}

// AVAILABLE gets no badge; the others tell visitors the listing is no longer open.
export const PUBLIC_STATUS_LABELS: Partial<Record<PropertyStatus, string>> = {
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
};

export function locationLine(p: Pick<ApiProperty, "address" | "city">): string {
  return [p.address, p.city].filter(Boolean).join(", ");
}

export const galleryImage = (url: string) => cardImage(url, 1400);
export const thumbImage = (url: string) => cardImage(url, 240);
