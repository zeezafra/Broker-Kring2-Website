"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, adminFetch, type LocationBarangay, type LocationCity, type LocationRegion } from "@/lib/admin-api";
import SearchableSelect, { type SelectOption } from "./SearchableSelect";

export type LocationValue = { region: string; cityCode: string; barangayCode: string };
export type LocationErrors = { region?: string; city?: string; barangay?: string };

type Props = {
  value: LocationValue;
  /** Called only when the admin changes something (never for the automatic loading), so the form can tell "touched" from "untouched". */
  onChange: (next: LocationValue) => void;
  street: string;
  onStreet: (v: string) => void;
  subdivision: string;
  onSubdivision: (v: string) => void;
  errors?: LocationErrors;
  /** Explains how an older listing's location was read, e.g. "Saved as “Carcar”…". */
  legacyNote?: string | null;
  /** Shows a "Clear location" link (used when a draft should have no location). */
  onClear?: () => void;
};

type Load<T> = { status: "idle" | "loading" | "ready" | "error"; data: T[]; message?: string };
const idle = <T,>(): Load<T> => ({ status: "idle", data: [] });

function messageFor(err: unknown) {
  return err instanceof ApiError ? err.message : "Could not load the list";
}

// Region -> City / Municipality -> Barangay, each list loaded from the API when the one above it is chosen.
// Changing the region clears the city and barangay; changing the city clears the barangay.
export default function LocationSelector({ value, onChange, street, onStreet, subdivision, onSubdivision, errors, legacyNote, onClear }: Props) {
  const [regions, setRegions] = useState<Load<LocationRegion>>({ status: "loading", data: [] });
  const [cities, setCities] = useState<Load<LocationCity>>(idle());
  const [barangays, setBarangays] = useState<Load<LocationBarangay>>(idle());
  const [retry, setRetry] = useState({ regions: 0, cities: 0, barangays: 0 });
  const bump = (k: keyof typeof retry) => setRetry((r) => ({ ...r, [k]: r[k] + 1 }));

  // Lists already fetched, so flipping back to a region or city does not hit the API again.
  const cache = useRef({ cities: new Map<string, LocationCity[]>(), barangays: new Map<string, LocationBarangay[]>() });

  useEffect(() => {
    let alive = true;
    setRegions((r) => ({ ...r, status: "loading" }));
    adminFetch<{ data: LocationRegion[] }>("/api/admin/locations/regions")
      .then((r) => alive && setRegions({ status: "ready", data: r.data }))
      .catch((e) => alive && setRegions({ status: "error", data: [], message: messageFor(e) }));
    return () => {
      alive = false;
    };
  }, [retry.regions]);

  useEffect(() => {
    if (!value.region) {
      setCities(idle());
      return;
    }
    const hit = cache.current.cities.get(value.region);
    if (hit) {
      setCities({ status: "ready", data: hit });
      return;
    }
    let alive = true;
    setCities({ status: "loading", data: [] });
    adminFetch<{ data: LocationCity[] }>(`/api/admin/locations/localities?region=${encodeURIComponent(value.region)}`)
      .then((r) => {
        if (!alive) return;
        cache.current.cities.set(value.region, r.data);
        setCities({ status: "ready", data: r.data });
      })
      .catch((e) => alive && setCities({ status: "error", data: [], message: messageFor(e) }));
    return () => {
      alive = false;
    };
  }, [value.region, retry.cities]);

  useEffect(() => {
    if (!value.cityCode) {
      setBarangays(idle());
      return;
    }
    const hit = cache.current.barangays.get(value.cityCode);
    if (hit) {
      setBarangays({ status: "ready", data: hit });
      return;
    }
    let alive = true;
    setBarangays({ status: "loading", data: [] });
    adminFetch<{ data: LocationBarangay[] }>(`/api/admin/locations/barangays?city=${encodeURIComponent(value.cityCode)}`)
      .then((r) => {
        if (!alive) return;
        cache.current.barangays.set(value.cityCode, r.data);
        setBarangays({ status: "ready", data: r.data });
      })
      .catch((e) => alive && setBarangays({ status: "error", data: [], message: messageFor(e) }));
    return () => {
      alive = false;
    };
  }, [value.cityCode, retry.barangays]);

  const regionOptions = useMemo<SelectOption[]>(() => regions.data.map((r) => ({ value: r.key, label: r.label })), [regions.data]);
  const cityOptions = useMemo<SelectOption[]>(() => cities.data.map((c) => ({ value: c.code, label: c.name })), [cities.data]);
  const barangayOptions = useMemo<SelectOption[]>(() => barangays.data.map((b) => ({ value: b.code, label: b.name })), [barangays.data]);

  // A saved value that is no longer in its list (the directory changed) must not look selected.
  const staleCity = cities.status === "ready" && value.cityCode !== "" && !cityOptions.some((o) => o.value === value.cityCode);
  const staleBarangay = barangays.status === "ready" && value.barangayCode !== "" && !barangayOptions.some((o) => o.value === value.barangayCode);

  const setRegion = useCallback((region: string) => onChange({ region, cityCode: "", barangayCode: "" }), [onChange]);
  const setCity = (cityCode: string) => onChange({ ...value, cityCode, barangayCode: "" });
  const setBarangay = (barangayCode: string) => onChange({ ...value, barangayCode });

  const hasAny = value.region !== "" || value.cityCode !== "" || value.barangayCode !== "";

  return (
    <div className="sm:col-span-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">Location</h3>
        {onClear && hasAny && (
          <button type="button" onClick={onClear} className="text-xs font-semibold text-gold-dark underline">
            Clear location
          </button>
        )}
      </div>
      {legacyNote && <p className="mt-2 rounded-[10px] bg-cream p-3 text-sm text-muted">{legacyNote}</p>}

      <div className="grid gap-x-5 sm:grid-cols-2">
        <SearchableSelect
          id="region"
          label="Region"
          required
          value={value.region}
          options={regionOptions}
          onChange={setRegion}
          placeholder="Select a region"
          loading={regions.status === "loading"}
          loadError={regions.status === "error" ? regions.message : null}
          onRetry={() => bump("regions")}
          error={errors?.region}
        />
        <SearchableSelect
          id="city"
          label="City / Municipality"
          required
          value={staleCity ? "" : value.cityCode}
          options={cityOptions}
          onChange={setCity}
          placeholder="Select a city or municipality"
          disabled={!value.region}
          disabledHint="Choose a region first"
          loading={cities.status === "loading"}
          loadError={cities.status === "error" ? cities.message : null}
          onRetry={() => bump("cities")}
          emptyText="No cities or municipalities in this region"
          error={errors?.city ?? (staleCity ? "The saved city is not in the list any more. Choose it again." : null)}
        />
        <SearchableSelect
          id="barangay"
          label="Barangay"
          required
          value={staleBarangay ? "" : value.barangayCode}
          options={barangayOptions}
          onChange={setBarangay}
          placeholder="Select a barangay"
          disabled={!value.cityCode}
          disabledHint="Choose a city or municipality first"
          loading={barangays.status === "loading"}
          loadError={barangays.status === "error" ? barangays.message : null}
          onRetry={() => bump("barangays")}
          emptyText="No barangays found for this city or municipality"
          error={errors?.barangay ?? (staleBarangay ? "The saved barangay is not in the list any more. Choose it again." : null)}
        />
        <div className="form-field">
          <label htmlFor="address">Street address</label>
          <input id="address" value={street} onChange={(e) => onStreet(e.target.value)} maxLength={200} placeholder="Optional, e.g. 12 Rizal Street" />
        </div>
        <div className="form-field sm:col-span-2">
          <label htmlFor="subdivision">Subdivision / project</label>
          <input id="subdivision" value={subdivision} onChange={(e) => onSubdivision(e.target.value)} maxLength={150} placeholder="Optional, e.g. the subdivision or condominium name" />
        </div>
      </div>
    </div>
  );
}
