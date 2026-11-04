"use client";

import { useEffect, useState } from "react";
import { ApiError, adminFetch, type AdminProperty } from "@/lib/admin-api";
import PropertyForm from "./PropertyForm";

export default function EditPropertyLoader({ id }: { id: string }) {
  const [property, setProperty] = useState<AdminProperty | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    adminFetch<{ data: AdminProperty }>(`/api/admin/properties/${encodeURIComponent(id)}`)
      .then((r) => alive && setProperty(r.data))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Could not load this listing"));
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!property) return <p role="status" className="text-muted">Loading listing…</p>;
  return <PropertyForm initial={property} />;
}
