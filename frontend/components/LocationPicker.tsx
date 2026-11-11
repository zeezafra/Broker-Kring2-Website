"use client";

import { useEffect, useState } from "react";
import { AREA_OPTIONS, type AreaSlug } from "@/lib/search";

// The public Location control: Region, then City / Municipality. Used in the hero search bar (inside a small
// panel) and in the /properties filters. Cities are the same list the admin form uses and are loaded per region,
// then kept so choosing the same region again does not ask the API again.
const cache = new Map<string, string[]>();

type Props = {
  area: AreaSlug | "";
  city: string;
  onChange: (next: { area: AreaSlug | ""; city: string }) => void;
  idPrefix: string;
};

export default function LocationPicker({ area, city, onChange, idPrefix }: Props) {
  const regionKey = AREA_OPTIONS.find((a) => a.slug === area)?.value ?? "";
  const [cities, setCities] = useState<string[]>(() => cache.get(regionKey) ?? []);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(() => (regionKey && cache.has(regionKey) ? "ready" : "idle"));

  useEffect(() => {
    if (!regionKey) {
      setCities([]);
      setStatus("idle");
      return;
    }
    const hit = cache.get(regionKey);
    if (hit) {
      setCities(hit);
      setStatus("ready");
      return;
    }
    let alive = true;
    setStatus("loading");
    fetch(`/api/locations/localities?region=${encodeURIComponent(regionKey)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad response"))))
      .then((body: { data: { name: string }[] }) => {
        if (!alive) return;
        const names = body.data.map((c) => c.name);
        cache.set(regionKey, names);
        setCities(names);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [regionKey]);

  // A city already in the URL that is not in the list (for example an older link) still shows as selected.
  const options = city && !cities.some((c) => c.toLowerCase() === city.toLowerCase()) ? [city, ...cities] : cities;

  return (
    <>
      <label className="filter-field" htmlFor={`${idPrefix}-region`}>
        Region
        <select id={`${idPrefix}-region`} value={area} onChange={(e) => onChange({ area: e.target.value as AreaSlug | "", city: "" })}>
          <option value="">All regions</option>
          {AREA_OPTIONS.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <label className="filter-field" htmlFor={`${idPrefix}-city`}>
        City / Municipality
        <select
          id={`${idPrefix}-city`}
          value={city}
          disabled={!area && !city}
          onChange={(e) => onChange({ area, city: e.target.value })}
        >
          <option value="">
            {!area && !city ? "Choose a region first" : status === "loading" ? "Loading…" : status === "error" ? "Could not load cities" : "All cities"}
          </option>
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
