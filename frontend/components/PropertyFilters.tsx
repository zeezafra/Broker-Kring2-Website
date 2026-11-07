"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  AREA_OPTIONS,
  areaValue,
  BEDROOM_OPTIONS,
  bandsFor,
  buildHref,
  filterCount,
  hasActiveFilters,
  locationValue,
  matchBand,
  parseSearch,
  priceLabel,
  SORT_OPTIONS,
  splitLocation,
  TYPE_OPTIONS,
  type SearchState,
  type SortKey,
} from "@/lib/search";

// Search box + filters + sort for /properties. Every change goes into the URL (see lib/search.ts), so a
// filtered view can be shared, bookmarked and reached with the Back button. The page re-fetches on navigation.
// The Buy/Rent tabs live in the page, not here; the current tab is kept when filters change.
export default function PropertyFilters({ state, locations }: { state: SearchState; locations: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false); // filter panel, small screens only

  const [q, setQ] = useState(state.q);
  // One dropdown holds an area ("area:south") or a city name; see lib/search.ts.
  const [location, setLocation] = useState(locationValue(state));
  const [type, setType] = useState<string>(state.type);
  const [beds, setBeds] = useState(state.beds === null ? "" : String(state.beds));
  // One "Price range" dropdown. Value is a band key, "" for any price, or "custom" when the URL carries a
  // min/max that matches no band (an old shared link): it stays selected and is kept until the visitor picks another.
  const bands = bandsFor(state.listing);
  const hasPrice = state.minPrice !== null || state.maxPrice !== null;
  const matched = matchBand(state.listing, state.minPrice, state.maxPrice);
  const [price, setPrice] = useState(!hasPrice ? "" : matched ? matched.key : "custom");
  const [sort, setSort] = useState<SortKey>(state.sort);

  // A city typed into the URL that is not one of the dropdown options still has to show as selected.
  const cityOptions =
    state.city && !locations.some((c) => c.toLowerCase() === state.city.toLowerCase()) ? [state.city, ...locations] : locations;

  function apply(sortOverride?: SortKey) {
    // parseSearch cleans the typed values the same way the page will (digits only, min/max swapped if reversed).
    const band = bands.find((b) => b.key === price);
    const keepCustom = price === "custom";
    const loc = splitLocation(location);
    const clean = parseSearch({
      q,
      city: loc.city,
      area: loc.area,
      type,
      beds,
      minPrice: String(band?.min ?? (keepCustom ? state.minPrice : null) ?? ""),
      maxPrice: String(band?.max ?? (keepCustom ? state.maxPrice : null) ?? ""),
      sort: sortOverride ?? sort,
    });
    startTransition(() => {
      router.push(
        buildHref({
          listing: state.listing,
          q: clean.q,
          city: clean.city,
          area: clean.area,
          type: clean.type,
          beds: clean.beds,
          minPrice: clean.minPrice,
          maxPrice: clean.maxPrice,
          sort: clean.sort,
        }),
      );
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    apply();
  }

  const active = filterCount(state);

  return (
    <form className="filters" role="search" aria-label="Search properties" aria-busy={pending} onSubmit={onSubmit}>
      <div className="filters-top">
        <label className="filter-search">
          <span className="sr-only">Search properties</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="search"
            name="q"
            value={q}
            maxLength={100}
            placeholder="Search listings"
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="filters-toggle"
          aria-expanded={open}
          aria-controls="filterPanel"
          onClick={() => setOpen((o) => !o)}
        >
          Filters
          {active > 0 && <span className="filters-count">{active}</span>}
        </button>
        <button className="gold-btn" type="submit" disabled={pending}>
          {pending ? "Searching…" : "Search"}
        </button>
      </div>

      <div id="filterPanel" className={`filters-panel${open ? " open" : ""}`}>
        <label className="filter-field">
          Property type
          <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Location
          <select name="location" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All locations</option>
            <optgroup label="Area">
              {AREA_OPTIONS.map((a) => (
                <option key={a.slug} value={areaValue(a.slug)}>
                  {a.label}
                </option>
              ))}
            </optgroup>
            {cityOptions.length > 0 && (
              <optgroup label="City">
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <label className="filter-field">
          Bedrooms
          <select name="beds" value={beds} onChange={(e) => setBeds(e.target.value)}>
            <option value="">Any</option>
            {BEDROOM_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Price range
          <select name="price" value={price} onChange={(e) => setPrice(e.target.value)}>
            <option value="">Any price</option>
            {price === "custom" && <option value="custom">Custom: {priceLabel(state.minPrice, state.maxPrice)}</option>}
            {bands.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Sort by
          <select
            name="sort"
            value={sort}
            onChange={(e) => {
              const next = e.target.value as SortKey;
              setSort(next);
              apply(next);
            }}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {hasActiveFilters(state) && (
          <div className="filters-actions">
            <Link href={buildHref({ listing: state.listing })}>Clear all filters</Link>
          </div>
        )}
      </div>
    </form>
  );
}
