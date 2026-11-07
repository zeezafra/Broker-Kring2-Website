// Types and fetch helper shared by the admin screens. Requests go to /api/* on this site (Next forwards
// them to the Render API), so the login cookie is sent automatically.

export type ListingType = "SALE" | "RENT";
export type PropertyType = "HOUSE_AND_LOT" | "CONDOMINIUM" | "TOWNHOUSE" | "COMMERCIAL" | "LOT";
export type CebuArea = "NORTH" | "SOUTH";
export type PropertyStatus = "DRAFT" | "AVAILABLE" | "RESERVED" | "SOLD" | "RENTED";

export type AdminProperty = {
  id: number;
  title: string;
  description: string | null;
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  price: number;
  city: string | null;
  /** North or South Cebu, chosen by the admin; null when not set. */
  area: CebuArea | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floorAreaSqm: number | null;
  lotAreaSqm: number | null;
  images: string[];
  featured: boolean;
  isPlaceholder: boolean;
  createdAt: string;
  updatedAt: string;
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = { SALE: "For sale", RENT: "For rent" };
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  HOUSE_AND_LOT: "House and lot",
  CONDOMINIUM: "Condominium",
  TOWNHOUSE: "Townhouse",
  LOT: "Lot",
  COMMERCIAL: "Commercial",
};
export const AREA_LABELS: Record<CebuArea, string> = { NORTH: "North Cebu", SOUTH: "South Cebu" };
export const STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Draft (hidden)",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Throws ApiError with a readable message. A 401 sends the person back to the login page.
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.assign("/admin/login");
  }
  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new ApiError(body?.error ?? `Something went wrong (${res.status})`, res.status);
  return body as T;
}

export const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

// ---- Phase 10: inquiry inbox ----

export type InquiryStatus = "NEW" | "CONTACTED" | "CLOSED";
export type InquiryType = "GENERAL" | "LISTING" | "SELL_APPRAISAL";
export type InquiryService = "SELL" | "APPRAISAL";

export type AdminInquiry = {
  id: number;
  type: InquiryType;
  status: InquiryStatus;
  name: string;
  phone: string;
  email: string;
  message: string;
  propertyId: number | null;
  propertyTitle: string | null;
  /** Phase 11: only on SELL_APPRAISAL inquiries. */
  service: InquiryService | null;
  propertyLocation: string | null;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
};

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  GENERAL: "General",
  LISTING: "About a listing",
  SELL_APPRAISAL: "Sell / appraisal",
};

export const INQUIRY_SERVICE_LABELS: Record<InquiryService, string> = {
  SELL: "Wants to sell",
  APPRAISAL: "Wants an appraisal",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CLOSED: "Closed",
};

// Inquiry times are shown in Philippine time whatever the admin's device is set to.
const manilaTime = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
export const formatInquiryTime = (iso: string) => manilaTime.format(new Date(iso));
