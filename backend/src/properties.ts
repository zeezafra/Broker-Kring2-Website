import { Router } from "express";
import type { Property } from "./generated/prisma/client";
import { ListingType } from "./generated/prisma/enums";
import { prisma } from "./db";

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

// GET /api/properties?listingType=SALE|RENT&featured=true&limit=20&offset=0
// Public: never returns DRAFT listings. Search, sort and richer filters arrive in Phase 8.
propertiesRouter.get("/", async (req, res) => {
  const { listingType, featured } = req.query;

  if (listingType !== undefined && !Object.values(ListingType).includes(listingType as ListingType)) {
    return res.status(400).json({ error: "listingType must be SALE or RENT" });
  }
  if (featured !== undefined && featured !== "true" && featured !== "false") {
    return res.status(400).json({ error: "featured must be true or false" });
  }
  const limit = parseIntParam(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = parseIntParam(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  if (limit === null) return res.status(400).json({ error: `limit must be a whole number from 1 to ${MAX_LIMIT}` });
  if (offset === null) return res.status(400).json({ error: "offset must be a whole number, 0 or more" });

  const where = {
    status: { not: "DRAFT" as const },
    ...(listingType ? { listingType: listingType as ListingType } : {}),
    ...(featured ? { featured: featured === "true" } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.property.count({ where }),
  ]);

  res.json({ data: rows.map(toPublic), total, limit, offset });
});

// GET /api/properties/:id
propertiesRouter.get("/:id", async (req, res) => {
  const id = parseIntParam(req.params.id, NaN, 1, 2_147_483_647);
  if (id === null || Number.isNaN(id)) return res.status(404).json({ error: "Property not found" });

  const property = await prisma.property.findFirst({ where: { id, status: { not: "DRAFT" } } });
  if (!property) return res.status(404).json({ error: "Property not found" });

  res.json({ data: toPublic(property) });
});
