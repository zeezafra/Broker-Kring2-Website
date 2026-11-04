"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ApiError,
  adminFetch,
  type AdminProperty,
  type ListingType,
  LISTING_TYPE_LABELS,
  type PropertyStatus,
  type PropertyType,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/admin-api";

const MAX_IMAGES = 12;
const MAX_FILE_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const selectClass = "w-full rounded-[10px] border border-[#ded6ca] bg-white p-3 outline-gold";

type Sign = { cloudName: string; apiKey: string; timestamp: number; folder: string; allowedFormats: string; signature: string };

// Photos go straight from the browser to Cloudinary using a one-time signature from our API.
async function uploadPhoto(file: File): Promise<string> {
  const sign = await adminFetch<Sign>("/api/admin/uploads/sign", { method: "POST", body: "{}" });
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sign.apiKey);
  body.append("timestamp", String(sign.timestamp));
  body.append("folder", sign.folder);
  body.append("allowed_formats", sign.allowedFormats);
  body.append("signature", sign.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body });
  const json = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!res.ok || !json?.secure_url) throw new Error(json?.error?.message ?? "Upload failed");
  return json.secure_url;
}

type FormState = {
  title: string;
  description: string;
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  price: string;
  city: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  floorAreaSqm: string;
  lotAreaSqm: string;
  featured: boolean;
  isPlaceholder: boolean;
  images: string[];
};

function toState(p?: AdminProperty): FormState {
  return {
    title: p?.title ?? "",
    description: p?.description ?? "",
    listingType: p?.listingType ?? "SALE",
    propertyType: p?.propertyType ?? "HOUSE_AND_LOT",
    status: p?.status ?? "DRAFT",
    price: p ? String(p.price) : "",
    city: p?.city ?? "",
    address: p?.address ?? "",
    bedrooms: p?.bedrooms != null ? String(p.bedrooms) : "",
    bathrooms: p?.bathrooms != null ? String(p.bathrooms) : "",
    floorAreaSqm: p?.floorAreaSqm != null ? String(p.floorAreaSqm) : "",
    lotAreaSqm: p?.lotAreaSqm != null ? String(p.lotAreaSqm) : "",
    featured: p?.featured ?? false,
    isPlaceholder: p?.isPlaceholder ?? false,
    images: p?.images ?? [],
  };
}

const num = (s: string) => (s.trim() === "" ? null : Number(s));

export default function PropertyForm({ initial }: { initial?: AdminProperty }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => toState(initial));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setF((s) => ({ ...s, [key]: value }));

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_IMAGES - f.images.length;
    if (files.length > room) {
      toast.error(room > 0 ? `You can add ${room} more photo${room === 1 ? "" : "s"} (max ${MAX_IMAGES}).` : `A listing can have up to ${MAX_IMAGES} photos.`);
      return;
    }
    const bad = files.find((file) => !ACCEPTED.includes(file.type) || file.size > MAX_FILE_MB * 1024 * 1024);
    if (bad) {
      toast.error(`“${bad.name}” can't be used. Photos must be JPG, PNG or WebP, up to ${MAX_FILE_MB} MB each.`);
      return;
    }

    setUploading(true);
    const job = Promise.all(files.map(uploadPhoto));
    toast.promise(job, {
      loading: `Uploading ${files.length} photo${files.length === 1 ? "" : "s"}…`,
      success: "Photos uploaded",
      error: (err: unknown) => (err instanceof Error ? err.message : "Upload failed"),
    });
    try {
      const urls = await job;
      setF((s) => ({ ...s, images: [...s.images, ...urls] }));
    } catch {
      // toast.promise already showed the error
    }
    setUploading(false);
  }

  function move(i: number, dir: -1 | 1) {
    setF((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.images.length) return s;
      const images = [...s.images];
      [images[i], images[j]] = [images[j], images[i]];
      return { ...s, images };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || uploading) return;
    setError(null);

    const payload = {
      title: f.title,
      description: f.description,
      listingType: f.listingType,
      propertyType: f.propertyType,
      status: f.status,
      price: num(f.price),
      city: f.city,
      address: f.address,
      bedrooms: num(f.bedrooms),
      bathrooms: num(f.bathrooms),
      floorAreaSqm: num(f.floorAreaSqm),
      lotAreaSqm: num(f.lotAreaSqm),
      featured: f.featured,
      isPlaceholder: f.isPlaceholder,
      images: f.images,
    };

    setSaving(true);
    try {
      await adminFetch(initial ? `/api/admin/properties/${initial.id}` : "/api/admin/properties", {
        method: initial ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(initial ? "Listing updated" : "Listing created");
      router.push("/admin/properties");
      return;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save the listing";
      setError(message);
      toast.error(message);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl font-semibold">{initial ? "Edit listing" : "Add listing"}</h1>
        <Link href="/admin/properties" className="text-sm font-semibold text-gold-dark hover:underline">← Back to listings</Link>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-serif text-2xl font-semibold">Basics</h2>
        <div className="form-field">
          <label htmlFor="title">Title</label>
          <input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} required maxLength={150} placeholder="e.g. 3-bedroom house in Talisay" />
        </div>
        <div className="grid gap-x-5 sm:grid-cols-3">
          <div className="form-field">
            <label htmlFor="listingType">For</label>
            <select id="listingType" className={selectClass} value={f.listingType} onChange={(e) => set("listingType", e.target.value as ListingType)}>
              {Object.entries(LISTING_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="propertyType">Property type</label>
            <select id="propertyType" className={selectClass} value={f.propertyType} onChange={(e) => set("propertyType", e.target.value as PropertyType)}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select id="status" className={selectClass} value={f.status} onChange={(e) => set("status", e.target.value as PropertyStatus)}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="price">Price in pesos{f.listingType === "RENT" && " (per month)"}</label>
          <input id="price" type="number" inputMode="decimal" min="1" step="any" value={f.price} onChange={(e) => set("price", e.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea id="description" value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={5000} rows={5} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-serif text-2xl font-semibold">Location and size</h2>
        <div className="grid gap-x-5 sm:grid-cols-2">
          <div className="form-field">
            <label htmlFor="city">City</label>
            <input id="city" value={f.city} onChange={(e) => set("city", e.target.value)} maxLength={120} />
          </div>
          <div className="form-field">
            <label htmlFor="address">Address</label>
            <input id="address" value={f.address} onChange={(e) => set("address", e.target.value)} maxLength={200} />
          </div>
          <div className="form-field">
            <label htmlFor="bedrooms">Bedrooms</label>
            <input id="bedrooms" type="number" min="0" max="99" step="1" value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="bathrooms">Bathrooms</label>
            <input id="bathrooms" type="number" min="0" max="99" step="1" value={f.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="floorAreaSqm">Floor area (m²)</label>
            <input id="floorAreaSqm" type="number" min="0" step="any" value={f.floorAreaSqm} onChange={(e) => set("floorAreaSqm", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="lotAreaSqm">Lot area (m²)</label>
            <input id="lotAreaSqm" type="number" min="0" step="any" value={f.lotAreaSqm} onChange={(e) => set("lotAreaSqm", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-serif text-2xl font-semibold">Photos</h2>
        <p className="mt-1 text-sm text-muted">
          The first photo is the cover shown on the site. JPG, PNG or WebP, up to {MAX_FILE_MB} MB each, max {MAX_IMAGES}.
        </p>
        {f.images.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {f.images.map((url, i) => (
              <li key={url} className="rounded-xl border border-[#e8e3dc] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="h-28 w-full rounded-lg object-cover" />
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {i === 0 && <span className="rounded-full bg-cream px-2 py-0.5 font-semibold text-gold-dark">Cover</span>}
                  <span className="ml-auto flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`} className="rounded border px-2 py-1 disabled:opacity-40">←</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === f.images.length - 1} aria-label={`Move photo ${i + 1} later`} className="rounded border px-2 py-1 disabled:opacity-40">→</button>
                    <button type="button" onClick={() => setF((s) => ({ ...s, images: s.images.filter((_, k) => k !== i) }))} aria-label={`Remove photo ${i + 1}`} className="rounded border border-red-300 px-2 py-1 text-red-700">✕</button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <label className="mt-4 inline-block cursor-pointer rounded-full border border-gold px-5 py-2.5 text-sm font-semibold text-gold-dark hover:bg-cream">
          {uploading ? "Uploading…" : "Add photos"}
          <input type="file" accept={ACCEPTED.join(",")} multiple onChange={onFiles} disabled={uploading || f.images.length >= MAX_IMAGES} className="sr-only" />
        </label>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-serif text-2xl font-semibold">Options</h2>
        <label className="mt-3 flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />
          <span>Show in “Featured properties” on the home page</span>
        </label>
        <label className="mt-3 flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4" checked={f.isPlaceholder} onChange={(e) => set("isPlaceholder", e.target.checked)} />
          <span>This is a placeholder (sample) listing</span>
        </label>
      </section>

      {error && <p role="alert" className="text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="gold-btn" disabled={saving || uploading}>
          {saving ? "Saving…" : uploading ? "Wait for photos…" : initial ? "Save changes" : "Create listing"}
        </button>
        <Link href="/admin/properties" className="rounded-full border border-gold px-6 py-3 font-semibold text-gold-dark hover:bg-cream">Cancel</Link>
      </div>
    </form>
  );
}
