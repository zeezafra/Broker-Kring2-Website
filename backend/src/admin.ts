import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { InquiryStatus, InquiryType, PropertyStatus } from "./generated/prisma/enums";
import { checkOrigin, requireAdmin } from "./auth";
import { prisma } from "./db";
import { parsePropertyInput } from "./propertyInput";
import { toPublic } from "./properties";

// Everything under /api/admin requires a logged-in admin.
export const adminRouter = Router();
adminRouter.use(requireAdmin);
// Browsers send Origin on cross-site writes; refuse any write from an unknown origin.
adminRouter.use((req: Request, res: Response, next: NextFunction) =>
  req.method === "GET" || req.method === "HEAD" ? next() : checkOrigin(req, res, next),
);

function parseId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= 2_147_483_647 ? n : null;
}

// GET /api/admin/summary  ->  counts that include DRAFT listings (the public API hides those)
adminRouter.get("/summary", async (_req, res) => {
  const [grouped, placeholders, inquiryGroups] = await Promise.all([
    prisma.property.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.property.count({ where: { isPlaceholder: true } }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const g of grouped) {
    byStatus[g.status] = g._count._all;
    total += g._count._all;
  }
  const inquiryByStatus: Record<string, number> = { NEW: 0, CONTACTED: 0, CLOSED: 0 };
  let inquiryTotal = 0;
  for (const g of inquiryGroups) {
    inquiryByStatus[g.status] = g._count._all;
    inquiryTotal += g._count._all;
  }
  res.json({
    properties: { total, byStatus, placeholders },
    inquiries: { total: inquiryTotal, byStatus: inquiryByStatus },
  });
});

// GET /api/admin/properties?limit=50&offset=0  ->  every listing including DRAFT, newest first
adminRouter.get("/properties", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const [rows, total] = await Promise.all([
    prisma.property.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: limit, skip: offset }),
    prisma.property.count(),
  ]);
  res.json({ data: rows.map(toPublic), total, limit, offset });
});

// GET /api/admin/properties/:id  ->  one listing, drafts included
adminRouter.get("/properties/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const property = id ? await prisma.property.findUnique({ where: { id } }) : null;
  if (!property) return res.status(404).json({ error: "Listing not found" });
  res.json({ data: toPublic(property) });
});

// A live listing needs a cover photo, otherwise its card on the site would be blank.
const NEEDS_PHOTO = "Add at least one photo before publishing. Save it as Draft if you don't have photos yet.";

// POST /api/admin/properties  ->  create (status defaults to DRAFT)
adminRouter.post("/properties", async (req, res) => {
  const parsed = parsePropertyInput(req.body, false);
  if (!parsed.ok) return res.status(400).json({ error: parsed.errors[0], errors: parsed.errors });

  const d = parsed.data;
  if ((d.status ?? PropertyStatus.DRAFT) !== PropertyStatus.DRAFT && !d.images?.length) {
    return res.status(400).json({ error: NEEDS_PHOTO, errors: [NEEDS_PHOTO] });
  }
  // The checks above guarantee the required fields exist; TypeScript can't see that, so spell them out.
  const created = await prisma.property.create({
    data: { ...d, title: d.title!, listingType: d.listingType!, propertyType: d.propertyType!, price: d.price! },
  });
  res.status(201).json({ data: toPublic(created) });
});

// PATCH /api/admin/properties/:id  ->  update only the fields sent (null clears an optional field)
adminRouter.patch("/properties/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const existing = id ? await prisma.property.findUnique({ where: { id } }) : null;
  if (!id || !existing) return res.status(404).json({ error: "Listing not found" });

  const parsed = parsePropertyInput(req.body, true);
  if (!parsed.ok) return res.status(400).json({ error: parsed.errors[0], errors: parsed.errors });

  const finalStatus = parsed.data.status ?? existing.status;
  const finalImages = parsed.data.images ?? existing.images;
  if (finalStatus !== PropertyStatus.DRAFT && finalImages.length === 0) {
    return res.status(400).json({ error: NEEDS_PHOTO, errors: [NEEDS_PHOTO] });
  }

  const updated = await prisma.property.update({ where: { id }, data: parsed.data });
  res.json({ data: toPublic(updated) });
});

// DELETE /api/admin/properties/:id
adminRouter.delete("/properties/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const existing = id ? await prisma.property.findUnique({ where: { id } }) : null;
  if (!id || !existing) return res.status(404).json({ error: "Listing not found" });
  await prisma.property.delete({ where: { id } });
  res.json({ ok: true });
});

// POST /api/admin/uploads/sign  ->  one-time signature so the browser can upload a photo straight to
// Cloudinary. Photos never pass through Render (ephemeral disk) or Vercel (request size limits).
const ALLOWED_FORMATS = "jpg,png,webp";
adminRouter.post("/uploads/sign", (_req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ error: "Photo upload is not configured yet" });
  }
  const folder = process.env.CLOUDINARY_FOLDER || "cebu-properties-by-mct";
  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signs the upload params sorted alphabetically, joined with &, plus the API secret, as SHA-1.
  const toSign = `allowed_formats=${ALLOWED_FORMATS}&folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");
  res.json({ cloudName, apiKey, timestamp, folder, allowedFormats: ALLOWED_FORMATS, signature });
});

// ---- Phase 10: inquiry inbox -----------------------------------------------------------------

const INQUIRY_STATUSES = Object.values(InquiryStatus) as string[];
const INQUIRY_TYPES = Object.values(InquiryType) as string[];

// GET /api/admin/inquiries?status=NEW|CONTACTED|CLOSED&type=GENERAL|LISTING|SELL_APPRAISAL&propertyId=12&limit=50&offset=0
//   -> { data, total, limit, offset, counts: { ALL, NEW, CONTACTED, CLOSED } }, newest first.
// `counts` ignore the status filter (so the tabs can show every number) but respect propertyId and type.
adminRouter.get("/inquiries", async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && (typeof status !== "string" || !INQUIRY_STATUSES.includes(status))) {
    return res.status(400).json({ error: "status must be NEW, CONTACTED or CLOSED" });
  }
  const { type } = req.query;
  if (type !== undefined && (typeof type !== "string" || !INQUIRY_TYPES.includes(type))) {
    return res.status(400).json({ error: "type must be GENERAL, LISTING or SELL_APPRAISAL" });
  }
  const propertyId = req.query.propertyId === undefined ? null : parseId(req.query.propertyId);
  if (req.query.propertyId !== undefined && propertyId === null) {
    return res.status(400).json({ error: "propertyId must be a listing number" });
  }
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const base = { ...(propertyId ? { propertyId } : {}), ...(type ? { type: type as InquiryType } : {}) };
  const where = status ? { ...base, status: status as InquiryStatus } : base;

  const [rows, total, grouped] = await Promise.all([
    prisma.inquiry.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: limit, skip: offset }),
    prisma.inquiry.count({ where }),
    prisma.inquiry.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);
  const counts: Record<string, number> = { ALL: 0, NEW: 0, CONTACTED: 0, CLOSED: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    counts.ALL += g._count._all;
  }
  res.json({ data: rows, total, limit, offset, counts });
});

// PATCH /api/admin/inquiries/:id  { status }  ->  move an inquiry through NEW -> CONTACTED -> CLOSED (any direction)
adminRouter.patch("/inquiries/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const status = req.body?.status;
  if (typeof status !== "string" || !INQUIRY_STATUSES.includes(status)) {
    return res.status(400).json({ error: "status must be NEW, CONTACTED or CLOSED" });
  }
  const existing = id ? await prisma.inquiry.findUnique({ where: { id }, select: { id: true } }) : null;
  if (!id || !existing) return res.status(404).json({ error: "Inquiry not found" });

  const updated = await prisma.inquiry.update({ where: { id }, data: { status: status as InquiryStatus } });
  res.json({ data: updated });
});

// DELETE /api/admin/inquiries/:id  ->  permanent. Lets the broker erase a person's details when asked.
adminRouter.delete("/inquiries/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const existing = id ? await prisma.inquiry.findUnique({ where: { id }, select: { id: true } }) : null;
  if (!id || !existing) return res.status(404).json({ error: "Inquiry not found" });
  await prisma.inquiry.delete({ where: { id } });
  res.json({ ok: true });
});
