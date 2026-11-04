"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ApiError,
  adminFetch,
  type AdminProperty,
  LISTING_TYPE_LABELS,
  peso,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/admin-api";

type ListResponse = { data: AdminProperty[]; total: number };

export default function PropertyList() {
  const [rows, setRows] = useState<AdminProperty[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminProperty | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await adminFetch<ListResponse>("/api/admin/properties?limit=100");
      setRows(r.data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load listings");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/properties/${toDelete.id}`, { method: "DELETE" });
      toast.success(`Deleted “${toDelete.title}”`);
      setToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete the listing");
    }
    setDeleting(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl font-semibold">Listings</h1>
        <Link href="/admin/properties/new" className="gold-btn">Add listing</Link>
      </div>

      {error && <p role="alert" className="mt-6 text-red-700">{error}</p>}
      {!rows && !error && <p role="status" className="mt-6 text-muted">Loading listings…</p>}
      {rows && rows.length === 0 && <p className="mt-6 text-muted">No listings yet. Add your first one.</p>}

      {rows && rows.length > 0 && (
        <ul className="mt-6 grid gap-3">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-card">
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0]} alt="" className="h-20 w-28 rounded-xl object-cover" />
              ) : (
                <div className="grid h-20 w-28 place-items-center rounded-xl bg-cream text-xs text-muted">No photo</div>
              )}
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="text-sm text-muted">
                  {LISTING_TYPE_LABELS[p.listingType]} · {PROPERTY_TYPE_LABELS[p.propertyType]} · {peso(p.price)}
                  {p.listingType === "RENT" && " / month"}
                </p>
                <p className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-cream px-2.5 py-0.5">{STATUS_LABELS[p.status]}</span>
                  {p.featured && <span className="rounded-full bg-cream px-2.5 py-0.5">Featured</span>}
                  {p.isPlaceholder && <span className="rounded-full bg-cream px-2.5 py-0.5">Placeholder</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/properties/${p.id}`} className="rounded-full border border-gold px-4 py-1.5 text-sm font-semibold text-gold-dark hover:bg-cream">
                  Edit
                </Link>
                <button onClick={() => setToDelete(p)} className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={`modal-backdrop ${toDelete ? "open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <div className="modal">
          <h2 id="delete-title">Delete this listing?</h2>
          <p>
            “{toDelete?.title}” will be removed from the site for good. If you only want to hide it, set its status
            to Draft instead.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setToDelete(null)} disabled={deleting} className="flex-1 rounded-full border border-gold px-5 py-3 font-semibold text-gold-dark">
              Keep it
            </button>
            <button onClick={confirmDelete} disabled={deleting} className="flex-1 rounded-full bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800">
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
