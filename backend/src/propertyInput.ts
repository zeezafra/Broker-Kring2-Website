import { CebuArea, ListingType, PropertyStatus, PropertyType } from "./generated/prisma/enums";

// Hand-rolled validation for admin listing input (no extra dependency). Returns clean Prisma data
// or a list of plain-English problems the admin form can show.

export const MAX_IMAGES = 12;

type Clean = {
  title?: string;
  description?: string | null;
  listingType?: ListingType;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  price?: number;
  city?: string | null;
  area?: CebuArea | null;
  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floorAreaSqm?: number | null;
  lotAreaSqm?: number | null;
  images?: string[];
  featured?: boolean;
  isPlaceholder?: boolean;
};

export type ParseResult = { ok: true; data: Clean } | { ok: false; errors: string[] };

const has = (o: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(o, k);

// partial=false (create): title, listingType, propertyType, price are required.
// partial=true (update): only the fields present are validated and returned.
export function parsePropertyInput(body: unknown, partial: boolean): ParseResult {
  const errors: string[] = [];
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, errors: ["Send the listing details as a JSON object"] };
  }
  const b = body as Record<string, unknown>;
  const data: Clean = {};

  function text(key: "description" | "city" | "address", label: string, max: number) {
    if (!has(b, key)) return;
    const v = b[key];
    if (v === null || v === "") {
      data[key] = null;
    } else if (typeof v !== "string" || v.trim().length > max) {
      errors.push(`${label} must be text up to ${max} characters`);
    } else {
      data[key] = v.trim();
    }
  }

  function whole(key: "bedrooms" | "bathrooms", label: string) {
    if (!has(b, key)) return;
    const v = b[key];
    if (v === null || v === "") data[key] = null;
    else if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 99) errors.push(`${label} must be a whole number from 0 to 99`);
    else data[key] = v;
  }

  function area(key: "floorAreaSqm" | "lotAreaSqm", label: string) {
    if (!has(b, key)) return;
    const v = b[key];
    if (v === null || v === "") data[key] = null;
    else if (typeof v !== "number" || !Number.isFinite(v) || v <= 0 || v > 1_000_000) errors.push(`${label} must be a number above 0 (in m²)`);
    else data[key] = v;
  }

  function oneOf<T extends string>(key: "listingType" | "propertyType" | "status", label: string, allowed: readonly T[], required: boolean) {
    if (!has(b, key)) {
      if (required) errors.push(`${label} is required`);
      return;
    }
    const v = b[key];
    if (typeof v !== "string" || !allowed.includes(v as T)) errors.push(`${label} is not a valid choice`);
    else (data as Record<string, unknown>)[key] = v;
  }

  // area: NORTH, SOUTH, or empty/null to clear it
  if (has(b, "area")) {
    const v = b.area;
    if (v === null || v === "") data.area = null;
    else if (typeof v !== "string" || !Object.values(CebuArea).includes(v as CebuArea)) errors.push("Area must be North Cebu, South Cebu or empty");
    else data.area = v as CebuArea;
  }

  // title
  if (has(b, "title")) {
    const v = b.title;
    if (typeof v !== "string" || v.trim().length < 3 || v.trim().length > 150) errors.push("Title must be 3 to 150 characters");
    else data.title = v.trim();
  } else if (!partial) errors.push("Title is required");

  text("description", "Description", 5000);
  text("city", "City", 120);
  text("address", "Address", 200);

  oneOf("listingType", "Listing type", Object.values(ListingType), !partial);
  oneOf("propertyType", "Property type", Object.values(PropertyType), !partial);
  oneOf("status", "Status", Object.values(PropertyStatus), false);

  // price (Decimal(14,2) holds up to 999,999,999,999.99)
  if (has(b, "price")) {
    const v = b.price;
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0 || v > 999_999_999_999) errors.push("Price must be a number above 0 (in pesos)");
    else data.price = Math.round(v * 100) / 100;
  } else if (!partial) errors.push("Price is required");

  whole("bedrooms", "Bedrooms");
  whole("bathrooms", "Bathrooms");
  area("floorAreaSqm", "Floor area");
  area("lotAreaSqm", "Lot area");

  if (has(b, "images")) {
    const v = b.images;
    if (!Array.isArray(v) || v.length > MAX_IMAGES || !v.every((u) => typeof u === "string" && /^https:\/\/[^\s]+$/.test(u) && u.length <= 1000)) {
      errors.push(`Images must be a list of up to ${MAX_IMAGES} https links`);
    } else data.images = v as string[];
  }

  for (const key of ["featured", "isPlaceholder"] as const) {
    if (!has(b, key)) continue;
    if (typeof b[key] !== "boolean") errors.push(`${key} must be true or false`);
    else data[key] = b[key] as boolean;
  }

  return errors.length ? { ok: false, errors } : { ok: true, data };
}
