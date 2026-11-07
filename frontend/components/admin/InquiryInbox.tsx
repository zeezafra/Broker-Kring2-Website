"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ApiError,
  adminFetch,
  formatInquiryTime,
  INQUIRY_SERVICE_LABELS,
  INQUIRY_STATUS_LABELS,
  INQUIRY_TYPE_LABELS,
  type AdminInquiry,
  type AdminProperty,
  type InquiryStatus,
  type InquiryType,
} from "@/lib/admin-api";

type Filter = "ALL" | InquiryStatus;
type Counts = Record<Filter, number>;
type ListResponse = { data: AdminInquiry[]; total: number; limit: number; counts: Counts };

const TABS: Filter[] = ["ALL", "NEW", "CONTACTED", "CLOSED"];
const TAB_LABELS: Record<Filter, string> = { ALL: "All", ...INQUIRY_STATUS_LABELS };
const EMPTY_COUNTS: Counts = { ALL: 0, NEW: 0, CONTACTED: 0, CLOSED: 0 };
const PAGE = 100;
const TYPE_OPTIONS: InquiryType[] = ["GENERAL", "LISTING", "SELL_APPRAISAL"];

// "tel:" links want digits and a leading plus only.
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

const STATUS_BADGE: Record<InquiryStatus, string> = {
  NEW: "bg-gold text-white",
  CONTACTED: "bg-cream text-ink",
  CLOSED: "bg-[#e9e6e1] text-muted",
};

// Which status buttons to offer for an inquiry: every status it is not already in.
const MOVES: Record<InquiryStatus, { to: InquiryStatus; label: string }[]> = {
  NEW: [
    { to: "CONTACTED", label: "Mark contacted" },
    { to: "CLOSED", label: "Close" },
  ],
  CONTACTED: [
    { to: "CLOSED", label: "Close" },
    { to: "NEW", label: "Mark as new" },
  ],
  CLOSED: [
    { to: "CONTACTED", label: "Reopen" },
    { to: "NEW", label: "Mark as new" },
  ],
};

export default function InquiryInbox() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [listingId, setListingId] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | InquiryType>("");
  const [listings, setListings] = useState<Pick<AdminProperty, "id" | "title">[]>([]);
  const [result, setResult] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<AdminInquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Listing names for the "Listing" filter. Failing to load them only hides the filter.
  useEffect(() => {
    let alive = true;
    adminFetch<{ data: AdminProperty[] }>("/api/admin/properties?limit=100")
      .then((r) => alive && setListings(r.data.map(({ id, title }) => ({ id, title }))))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // Reload whenever a filter changes or `reloadKey` is bumped after an action.
  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ limit: String(PAGE) });
    if (filter !== "ALL") qs.set("status", filter);
    if (listingId) qs.set("propertyId", listingId);
    if (typeFilter) qs.set("type", typeFilter);
    adminFetch<ListResponse>(`/api/admin/inquiries?${qs}`)
      .then((r) => {
        if (!alive) return;
        setResult(r);
        setError(null);
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Could not load inquiries"));
    return () => {
      alive = false;
    };
  }, [filter, listingId, typeFilter, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);
  const counts = result?.counts ?? EMPTY_COUNTS;

  async function move(row: AdminInquiry, to: InquiryStatus) {
    setBusyId(row.id);
    try {
      await adminFetch(`/api/admin/inquiries/${row.id}`, { method: "PATCH", body: JSON.stringify({ status: to }) });
      toast.success(`${row.name}: ${INQUIRY_STATUS_LABELS[to].toLowerCase()}`);
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update the inquiry");
    }
    setBusyId(null);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/inquiries/${toDelete.id}`, { method: "DELETE" });
      toast.success("Inquiry deleted");
      setToDelete(null);
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete the inquiry");
    }
    setDeleting(false);
  }

  const rows = result?.data ?? null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl font-semibold">Inquiries</h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "" | InquiryType)}
              className="max-w-[16rem] rounded-xl border border-[#ded6ca] bg-white px-3 py-2"
            >
              <option value="">All types</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {INQUIRY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        {listings.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Listing</span>
            <select
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="max-w-[16rem] rounded-xl border border-[#ded6ca] bg-white px-3 py-2"
            >
              <option value="">All inquiries</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>
        )}
        </div>
      </div>

      <div role="tablist" aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={filter === t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              filter === t ? "bg-gold text-white" : "border border-gold text-gold-dark hover:bg-white"
            }`}
          >
            {TAB_LABELS[t]} <span className="opacity-80">({counts[t]})</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-6 text-red-700">{error}</p>}
      {!rows && !error && <p role="status" className="mt-6 text-muted">Loading inquiries…</p>}
      {rows && rows.length === 0 && (
        <p className="mt-6 text-muted">
          {counts.ALL === 0 && !listingId && !typeFilter ? "No inquiries yet. New ones from the website will appear here." : "Nothing in this view."}
        </p>
      )}

      {rows && rows.length > 0 && (
        <>
          <ul className="mt-6 grid gap-3">
            {rows.map((q) => (
              <li key={q.id} className="rounded-2xl bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-lg font-semibold">{q.name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[q.status]}`}>
                    {INQUIRY_STATUS_LABELS[q.status]}
                  </span>
                  {q.type === "SELL_APPRAISAL" && (
                    <span className="rounded-full border border-gold px-2.5 py-0.5 text-xs font-semibold text-gold-dark">
                      {q.service ? INQUIRY_SERVICE_LABELS[q.service] : INQUIRY_TYPE_LABELS.SELL_APPRAISAL}
                    </span>
                  )}
                  <span className="ml-auto text-sm text-muted">{formatInquiryTime(q.createdAt)}</span>
                </div>

                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <a href={telHref(q.phone)} className="font-semibold text-gold-dark hover:underline">{q.phone}</a>
                  <a href={`mailto:${q.email}`} className="break-all font-semibold text-gold-dark hover:underline">{q.email}</a>
                </p>

                <p className="mt-2 text-sm text-muted">
                  {q.type === "SELL_APPRAISAL" ? (
                    <>Property location: <span className="font-semibold text-ink">{q.propertyLocation ?? "not given"}</span></>
                  ) : q.propertyId ? (
                    <>
                      About:{" "}
                      <Link href={`/properties/${q.propertyId}`} target="_blank" className="font-semibold text-ink hover:underline">
                        {q.propertyTitle ?? `Listing #${q.propertyId}`}
                      </Link>
                    </>
                  ) : q.propertyTitle ? (
                    <>About: {q.propertyTitle} (listing since removed)</>
                  ) : (
                    "General inquiry"
                  )}
                </p>

                <p className="mt-3 whitespace-pre-wrap break-words">{q.message}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {MOVES[q.status].map((m) => (
                    <button
                      key={m.to}
                      disabled={busyId === q.id}
                      onClick={() => move(q, m.to)}
                      className="rounded-full border border-gold px-4 py-1.5 text-sm font-semibold text-gold-dark hover:bg-cream disabled:opacity-60"
                    >
                      {m.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setToDelete(q)}
                    className="ml-auto rounded-full border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {result && result.total > rows.length && (
            <p className="mt-4 text-sm text-muted">Showing the newest {rows.length} of {result.total}.</p>
          )}
        </>
      )}

      <div className={`modal-backdrop ${toDelete ? "open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="delete-inquiry-title">
        <div className="modal">
          <h2 id="delete-inquiry-title">Delete this inquiry?</h2>
          <p>
            The inquiry from {toDelete?.name} will be erased for good, including their phone number and email. Use this when
            someone asks for their details to be removed, or for spam.
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
