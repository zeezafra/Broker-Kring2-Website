import { Router } from "express";
import type { Prisma, Property } from "./generated/prisma/client";
import { CebuArea, ListingType, PropertyType } from "./generated/prisma/enums";
import { prisma } from "./db";
import { REGION_KEYS } from "./locations";

export const propertiesRouter = Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Decimal is not JSON-friendly, so prices go out as plain numbers (pesos).
export function toPublic(p: Property) {
  return { ...p, price: Number(p.price) };
}

function parseIntParam(value: unknown, fallback: number, min: number, max: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n >= min && n <= max ? n : null;
}

const MAX_PRICE = 999_999_999_999; // same ceiling the admin form enforces
const MAX_Q_LENGTH = 100;
const MAX_Q_WORDS = 5;
const MAX_CITY_LENGTH = 60;
const SORTS = ["newest", "price_asc", "price_desc"] as const;
type Sort = (typeof SORTS)[number];

// "contains" is a LIKE under the hood, so a typed % or _ would act as a wildcard. Match them literally.
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&");
}

// Fresh arrays each call: Prisma's orderBy type is a mutable array.
function orderFor(sort: Sort): Prisma.PropertyOrderByWithRelationInput[] {
  if (sort === "price_asc") return [{ price: "asc" }, { id: "desc" }];
  if (sort === "price_desc") return [{ price: "desc" }, { id: "desc" }];
  return [{ createdAt: "desc" }, { id: "desc" }];
}

// GET /api/properties
//   listingType=SALE|RENT   featured=true|false   limit=1..100   offset=0..
//   Phase 8 search + filters (all optional, combined with AND):
//   q=words (each word must appear in title, city, address or description)
//   city=Cebu City (matches the city exactly, or appears in the address; case-insensitive)
//   area=NORTH|SOUTH (the admin-chosen half of Cebu; kept so old links keep working)
//   region=NORTH_CEBU|SOUTH_CEBU|WEST_CENTRAL_CEBU|METRO_CEBU_MACTAN (the admin's location regions; North and
//   South also match older listings that only have the North/South area set)
//   propertyType=HOUSE_AND_LOT|CONDOMINIUM|TOWNHOUSE|COMMERCIAL|LOT
//   minPrice=pesos  maxPrice=pesos (inclusive; for RENT listings the price is the monthly rent)
//   minBedrooms=1..9 (listings with no bedroom count never match)
//   sort=newest (default)|price_asc|price_desc
// Public: never returns DRAFT listings.
propertiesRouter.get("/", async (req, res) => {
  const { listingType, featured, propertyType, area, region } = req.query;

  if (listingType !== undefined && !Object.values(ListingType).includes(listingType as ListingType)) {
    return res.status(400).json({ error: "listingType must be SALE or RENT" });
  }
  if (featured !== undefined && featured !== "true" && featured !== "false") {
    return res.status(400).json({ error: "featured must be true or false" });
  }
  if (propertyType !== undefined && !Object.values(PropertyType).includes(propertyType as PropertyType)) {
    return res.status(400).json({ error: `propertyType must be one of ${Object.values(PropertyType).join(", ")}` });
  }
  if (area !== undefined && !Object.values(CebuArea).includes(area as CebuArea)) {
    return res.status(400).json({ error: "area must be NORTH or SOUTH" });
  }
  if (region !== undefined && (typeof region !== "string" || !REGION_KEYS.includes(region))) {
    return res.status(400).json({ error: `region must be one of ${REGION_KEYS.join(", ")}` });
  }
  const limit = parseIntParam(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = parseIntParam(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  if (limit === null) return res.status(400).json({ error: `limit must be a whole number from 1 to ${MAX_LIMIT}` });
  if (offset === null) return res.status(400).json({ error: "offset must be a whole number, 0 or more" });

  const minPrice = req.query.minPrice === undefined ? undefined : parseIntParam(req.query.minPrice, 0, 0, MAX_PRICE);
  const maxPrice = req.query.maxPrice === undefined ? undefined : parseIntParam(req.query.maxPrice, 0, 1, MAX_PRICE);
  if (minPrice === null) return res.status(400).json({ error: "minPrice must be a whole number of pesos, 0 or more" });
  if (maxPrice === null) return res.status(400).json({ error: "maxPrice must be a whole number of pesos, 1 or more" });
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return res.status(400).json({ error: "minPrice cannot be higher than maxPrice" });
  }
  const minBedrooms = req.query.minBedrooms === undefined ? undefined : parseIntParam(req.query.minBedrooms, 0, 1, 9);
  if (minBedrooms === null) return res.status(400).json({ error: "minBedrooms must be a whole number from 1 to 9" });

  const sort = req.query.sort === undefined ? "newest" : req.query.sort;
  if (typeof sort !== "string" || !SORTS.includes(sort as Sort)) {
    return res.status(400).json({ error: `sort must be one of ${SORTS.join(", ")}` });
  }

  const q = req.query.q;
  if (q !== undefined && (typeof q !== "string" || q.length > MAX_Q_LENGTH * 2)) {
    return res.status(400).json({ error: `q must be a single text value of at most ${MAX_Q_LENGTH} characters` });
  }
  const words = typeof q === "string" ? q.trim().split(/\s+/).filter(Boolean).slice(0, MAX_Q_WORDS) : [];
  if (typeof q === "string" && q.trim().length > MAX_Q_LENGTH) {
    return res.status(400).json({ error: `q must be text of at most ${MAX_Q_LENGTH} characters` });
  }

  const city = req.query.city;
  if (city !== undefined && (typeof city !== "string" || city.length > MAX_CITY_LENGTH)) {
    return res.status(400).json({ error: `city must be text of at most ${MAX_CITY_LENGTH} characters` });
  }
  const cityTerm = typeof city === "string" ? city.trim() : "";

  const and: Prisma.PropertyWhereInput[] = [];
  // Every word has to match somewhere, so "modern cebu" finds a modern house in Cebu City.
  for (const word of words) {
    const contains = { contains: escapeLike(word), mode: "insensitive" as const };
    and.push({ OR: [{ title: contains }, { city: contains }, { address: contains }, { description: contains }] });
  }
  if (cityTerm) {
    and.push({
      OR: [
        { city: { equals: escapeLike(cityTerm), mode: "insensitive" } },
        { address: { contains: escapeLike(cityTerm), mode: "insensitive" } },
      ],
    });
  }

  // Older listings have only `area` (NORTH/SOUTH) and no `region`, so North and South also match on `area`.
  const regionArea: Record<string, CebuArea> = { NORTH_CEBU: CebuArea.NORTH, SOUTH_CEBU: CebuArea.SOUTH };
  if (typeof region === "string") {
    const legacy = regionArea[region];
    and.push({ OR: [{ region }, ...(legacy ? [{ region: null, area: legacy }] : [])] });
  }

  const where: Prisma.PropertyWhereInput = {
    status: { not: "DRAFT" },
    ...(listingType ? { listingType: listingType as ListingType } : {}),
    ...(featured ? { featured: featured === "true" } : {}),
    ...(propertyType ? { propertyType: propertyType as PropertyType } : {}),
    ...(area ? { area: area as CebuArea } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
      : {}),
    ...(minBedrooms !== undefined ? { bedrooms: { gte: minBedrooms } } : {}),
    ...(and.length ? { AND: and } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.property.findMany({ where, orderBy: orderFor(sort as Sort), take: limit, skip: offset }),
    prisma.property.count({ where }),
  ]);

  res.json({ data: rows.map(toPublic), total, limit, offset });
});

// GET /api/properties/locations
// Phase 8: the cities that listings actually use, for the Location dropdowns (hero + /properties).
// Distinct, trimmed, case-insensitive duplicates merged, A-Z. DRAFT listings do not count.
// Must stay above "/:id" or Express would read "locations" as an id.
propertiesRouter.get("/locations", async (_req, res) => {
  const rows = await prisma.property.findMany({
    where: { status: { not: "DRAFT" }, city: { not: null } },
    select: { city: true },
    distinct: ["city"],
  });
  const byKey = new Map<string, string>();
  for (const { city } of rows) {
    const name = city?.replace(/\s+/g, " ").trim();
    if (name && !byKey.has(name.toLowerCase())) byKey.set(name.toLowerCase(), name);
  }
  const data = [...byKey.values()].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  res.json({ data });
});

// GET /api/properties/:id
propertiesRouter.get("/:id", async (req, res) => {
  const id = parseIntParam(req.params.id, NaN, 1, 2_147_483_647);
  if (id === null || Number.isNaN(id)) return res.status(404).json({ error: "Property not found" });

  const property = await prisma.property.findFirst({ where: { id, status: { not: "DRAFT" } } });
  if (!property) return res.status(404).json({ error: "Property not found" });

  res.json({ data: toPublic(property) });
});
