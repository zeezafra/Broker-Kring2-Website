// Phase 8: one place that defines what visitors can search by and how that maps to the URL.
// Used by the hero search bar (client), the /properties filter bar (client) and the page itself (server),
// so it must stay free of server-only code.

export type ListingFilter = "all" | "buy" | "rent";
export type SortKey = "newest" | "price-asc" | "price-desc";
export type TypeSlug = "house-and-lot" | "condominium" | "townhouse" | "commercial" | "lot";
export type AreaSlug = "north" | "south" | "west-central" | "metro";

// Cities are NOT defined here: the Location panel loads them per region (GET /api/locations/localities).
// Property types are a fixed list from the HTML dropdown; the broker still has to confirm it.
export const TYPE_OPTIONS: { slug: TypeSlug; value: string; label: string }[] = [
  { slug: "house-and-lot", value: "HOUSE_AND_LOT", label: "House & Lot" },
  { slug: "condominium", value: "CONDOMINIUM", label: "Condominium" },
  { slug: "townhouse", value: "TOWNHOUSE", label: "Townhouse" },
  { slug: "commercial", value: "COMMERCIAL", label: "Commercial" },
  { slug: "lot", value: "LOT", label: "Lot" },
];

// The four Cebu regions from the admin's location selector (website browsing categories, not official ones).
// `value` is the region key the API filters on (GET /api/properties?region=...). They are fixed and always
// shown in the Location dropdowns. The URL still uses the short slug, so old ?area=north links keep working.
export const AREA_OPTIONS: { slug: AreaSlug; value: string; label: string }[] = [
  { slug: "north", value: "NORTH_CEBU", label: "North Cebu" },
  { slug: "south", value: "SOUTH_CEBU", label: "South Cebu" },
  { slug: "west-central", value: "WEST_CENTRAL_CEBU", label: "West / Central Cebu" },
  { slug: "metro", value: "METRO_CEBU_MACTAN", label: "Metro Cebu & Mactan" },
];

// The hero's "Price Range" bands. They are purchase-price bands, so choosing one from the hero also
// switches the results to Buy (see heroHref); otherwise "Below ₱5M" would list every rental.
export const PRICE_BANDS: { key: string; label: string; min?: number; max?: number }[] = [
  { key: "below-5m", label: "Below ₱5M", max: 5_000_000 },
  { key: "5m-10m", label: "₱5M – ₱10M", min: 5_000_000, max: 10_000_000 },
  { key: "10m-20m", label: "₱10M – ₱20M", min: 10_000_000, max: 20_000_000 },
  { key: "above-20m", label: "Above ₱20M", min: 20_000_000 },
];

// The /properties "Price range" dropdown (replaces the separate Min/Max boxes). Buy and All use the purchase bands
// above; Rent uses monthly-rent bands. The URL still carries minPrice/maxPrice, so old links keep working.
// The rent band edges are a proposal (nothing in the brief fixes them): edit the numbers here to change them.
export const RENT_PRICE_BANDS: { key: string; label: string; min?: number; max?: number }[] = [
  { key: "below-15k", label: "Below ₱15,000", max: 15_000 },
  { key: "15k-30k", label: "₱15,000 – ₱30,000", min: 15_000, max: 30_000 },
  { key: "30k-60k", label: "₱30,000 – ₱60,000", min: 30_000, max: 60_000 },
  { key: "above-60k", label: "Above ₱60,000", min: 60_000 },
];

export const bandsFor = (listing: ListingFilter) => (listing === "rent" ? RENT_PRICE_BANDS : PRICE_BANDS);

/** The band whose edges equal the given min/max, if any (otherwise the range came from a custom URL). */
export function matchBand(listing: ListingFilter, min: number | null, max: number | null) {
  return bandsFor(listing).find((b) => (b.min ?? null) === min && (b.max ?? null) === max);
}

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
];

export const BEDROOM_OPTIONS = [1, 2, 3, 4];

export type SearchState = {
  listing: ListingFilter;
  q: string;
  city: string;
  area: AreaSlug | "";
  type: TypeSlug | "";
  minPrice: number | null;
  maxPrice: number | null;
  beds: number | null;
  sort: SortKey;
  page: number;
};

export const EMPTY_SEARCH: SearchState = {
  listing: "all",
  q: "",
  city: "",
  area: "",
  type: "",
  minPrice: null,
  maxPrice: null,
  beds: null,
  sort: "newest",
  page: 1,
};

const MAX_PRICE = 999_999_999_999; // same ceiling the admin form and API enforce

export type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function parsePrice(v: string): number | null {
  const digits = v.replace(/[,\s₱]/g, "");
  if (!/^\d{1,12}$/.test(digits)) return null;
  const n = Number(digits);
  return n > 0 && n <= MAX_PRICE ? n : null;
}

// Turns whatever is in the URL into a clean, safe state. Bad values are dropped, never an error.
export function parseSearch(sp: RawParams): SearchState {
  const listingRaw = first(sp.listing);
  const typeRaw = first(sp.type);
  const areaRaw = first(sp.area);
  const sortRaw = first(sp.sort);
  const bedsRaw = first(sp.beds);
  const pageRaw = first(sp.page);

  let minPrice = parsePrice(first(sp.minPrice));
  let maxPrice = parsePrice(first(sp.maxPrice));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

  const area = AREA_OPTIONS.find((a) => a.slug === areaRaw)?.slug ?? "";

  return {
    listing: listingRaw === "buy" || listingRaw === "rent" ? listingRaw : "all",
    q: first(sp.q).replace(/\s+/g, " ").trim().slice(0, 100),
    // Region and city can be combined (the Location panel has a Region dropdown and a City dropdown).
    city: first(sp.city).replace(/\s+/g, " ").trim().slice(0, 60),
    area,
    type: TYPE_OPTIONS.some((t) => t.slug === typeRaw) ? (typeRaw as TypeSlug) : "",
    minPrice,
    maxPrice,
    beds: /^[1-9]$/.test(bedsRaw) ? Number(bedsRaw) : null,
    sort: SORT_OPTIONS.some((s) => s.key === sortRaw) ? (sortRaw as SortKey) : "newest",
    page: /^\d+$/.test(pageRaw) ? Math.min(Math.max(Number(pageRaw), 1), 10_000) : 1,
  };
}

// Builds a clean /properties URL: only values that differ from the defaults appear.
export function buildHref(state: Partial<SearchState>, base = "/properties"): string {
  const s = { ...EMPTY_SEARCH, ...state };
  const qs = new URLSearchParams();
  if (s.listing !== "all") qs.set("listing", s.listing);
  if (s.q) qs.set("q", s.q);
  if (s.type) qs.set("type", s.type);
  if (s.area) qs.set("area", s.area);
  if (s.city) qs.set("city", s.city);
  if (s.minPrice !== null) qs.set("minPrice", String(s.minPrice));
  if (s.maxPrice !== null) qs.set("maxPrice", String(s.maxPrice));
  if (s.beds !== null) qs.set("beds", String(s.beds));
  if (s.sort !== "newest") qs.set("sort", s.sort);
  if (s.page > 1) qs.set("page", String(s.page));
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
}

// Search narrowing (everything except the Buy/Rent tab and the page number).
export function hasActiveFilters(s: SearchState): boolean {
  return filterCount(s) > 0 || s.sort !== "newest";
}

export function filterCount(s: SearchState): number {
  return [s.q, s.area || s.city, s.type, s.minPrice, s.maxPrice, s.beds].filter((v) => v !== "" && v !== null).length;
}

// Query string for the backend API (GET /api/properties).
export function toApiParams(s: SearchState, pageSize: number): URLSearchParams {
  const qs = new URLSearchParams({ limit: String(pageSize), offset: String((s.page - 1) * pageSize) });
  if (s.listing === "buy") qs.set("listingType", "SALE");
  if (s.listing === "rent") qs.set("listingType", "RENT");
  if (s.q) qs.set("q", s.q);
  if (s.city) qs.set("city", s.city);
  const area = AREA_OPTIONS.find((a) => a.slug === s.area);
  if (area) qs.set("region", area.value);
  const type = TYPE_OPTIONS.find((t) => t.slug === s.type);
  if (type) qs.set("propertyType", type.value);
  if (s.minPrice !== null) qs.set("minPrice", String(s.minPrice));
  if (s.maxPrice !== null) qs.set("maxPrice", String(s.maxPrice));
  if (s.beds !== null) qs.set("minBedrooms", String(s.beds));
  if (s.sort === "price-asc") qs.set("sort", "price_asc");
  if (s.sort === "price-desc") qs.set("sort", "price_desc");
  return qs;
}

// Where the hero search bar sends the visitor. `area` is a region slug and `city` a city or municipality name
// (both from the Location panel).
export function heroHref(v: { area: AreaSlug | ""; city: string; type: string; band: string }): string {
  const band = PRICE_BANDS.find((b) => b.key === v.band);
  return buildHref({
    listing: band ? "buy" : "all",
    area: v.area,
    city: v.city,
    type: TYPE_OPTIONS.some((t) => t.slug === v.type) ? (v.type as TypeSlug) : "",
    minPrice: band?.min ?? null,
    maxPrice: band?.max ?? null,
  });
}

// Compact peso label for chips: 5000000 -> ₱5M, 2500000 -> ₱2.5M, 25000 -> ₱25,000.
export function pesoShort(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₱${Number.isInteger(m) ? m : m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  return `₱${n.toLocaleString("en-PH")}`;
}

export function priceLabel(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${pesoShort(min)} – ${pesoShort(max)}`;
  if (min !== null) return `${pesoShort(min)} and up`;
  if (max !== null) return `Up to ${pesoShort(max)}`;
  return "";
}
