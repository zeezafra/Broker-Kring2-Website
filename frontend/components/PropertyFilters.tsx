"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  BEDROOM_OPTIONS,
  buildHref,
  filterCount,
  hasActiveFilters,
  parseSearch,
  SORT_OPTIONS,
  TYPE_OPTIONS,
  type AreaSlug,
  type SearchState,
  type SortKey,
} from "@/lib/search";
import { priceScaleFor, pricesFromRange, rangeFromPrices, type PriceRange } from "@/lib/priceRange";
import LocationPicker from "./LocationPicker";
import PriceRangeSlider from "./PriceRangeSlider";

// Whether the mobile "Filters" panel is open. PropertyFilters is remounted (key = URL, see app/properties/page.tsx)
// every time results change, which would otherwise close the panel under the visitor's finger after each slider
// release. A module variable survives the remount; it is only ever set from a click, never on the server, so the
// first (server) render and hydration always start closed.
let panelWasOpen = false;

// Search box + filters + sort for /properties. Every change goes into the URL (see lib/search.ts), so a
// filtered view can be shared, bookmarked and reached with the Back button. The page re-fetches on navigation.
// The Buy/Rent tabs live in the page, not here; the current tab is kept when filters change.
export default function PropertyFilters({ state }: { state: SearchState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(() => panelWasOpen); // filter panel, small screens only

  const [q, setQ] = useState(state.q);
  // Region and city are two linked dropdowns (LocationPicker).
  const [area, setArea] = useState<AreaSlug | "">(state.area);
  const [city, setCity] = useState(state.city);
  const [type, setType] = useState<string>(state.type);
  const [beds, setBeds] = useState(state.beds === null ? "" : String(state.beds));
  // Price range: a dual-thumb slider (PriceRangeSlider). The scale depends on the Buy/Rent tab (sale prices vs.
  // monthly rent). The range is held here as slider values; apply() turns it into minPrice / maxPrice for the URL.
  // A price that came from an old link or the hero's band dropdown is shown as it is and only changes if the
  // visitor moves a thumb.
  const priceScale = priceScaleFor(state.listing);
  const [range, setRange] = useState<PriceRange>(() => rangeFromPrices(priceScale, state.minPrice, state.maxPrice));
  const [sort, setSort] = useState<SortKey>(state.sort);

  // `override` lets a control apply its own new value at once (Sort, and the price slider on release / Reset),
  // because setState has not updated yet when the handler runs.
  function apply(override: { sort?: SortKey; range?: PriceRange } = {}) {
    // parseSearch cleans the values the same way the page will (digits only, min/max swapped if reversed).
    const prices = pricesFromRange(priceScale, override.range ?? range);
    const clean = parseSearch({
      q,
      city,
      area,
      type,
      beds,
      minPrice: String(prices.minPrice ?? ""),
      maxPrice: String(prices.maxPrice ?? ""),
      sort: override.sort ?? sort,
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
        // Releasing the slider must not jump the page to the top (the visitor may be mid-adjustment on a phone).
        override.range ? { scroll: false } : undefined,
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
          onClick={() => {
            panelWasOpen = !open;
            setOpen(!open);
          }}
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
        <LocationPicker
          idPrefix="filters"
          area={area}
          city={city}
          onChange={(next) => {
            setArea(next.area);
            setCity(next.city);
          }}
        />
        <div className="filter-price">
          <PriceRangeSlider
            scale={priceScale}
            value={range}
            onChange={setRange}
            onCommit={(next) => {
              setRange(next);
              apply({ range: next });
            }}
          />
        </div>
        <div className="filter-stack">
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
            Sort by
            <select
              name="sort"
              value={sort}
              onChange={(e) => {
                const next = e.target.value as SortKey;
                setSort(next);
                apply({ sort: next });
              }}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {hasActiveFilters(state) && (
          <div className="filters-actions">
            <Link href={buildHref({ listing: state.listing })}>Clear all filters</Link>
          </div>
        )}
      </div>
    </form>
  );
}
