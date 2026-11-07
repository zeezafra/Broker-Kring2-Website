import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import PropertyFilters from "@/components/PropertyFilters";
import { PropertyCard, PropertyCardSkeletons } from "@/components/PropertyCard";
import SiteShell from "@/components/SiteShell";
import { getLocations, getProperties, PAGE_SIZE } from "@/lib/public-api";
import {
  buildHref,
  hasActiveFilters,
  parseSearch,
  type RawParams,
  priceLabel,
  AREA_OPTIONS,
  TYPE_OPTIONS,
  type ListingFilter,
  type SearchState,
} from "@/lib/search";

type SearchParams = RawParams;

export const metadata: Metadata = {
  title: "Properties | Cebu Properties by MCT",
  description: "Browse properties for sale and for rent listed by Marie Chris L. Tagsip, Licensed Real Estate Broker & Appraiser.",
};

const TABS: { key: ListingFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "buy", label: "Buy" },
  { key: "rent", label: "Rent" },
];

const TITLES: Record<ListingFilter, string> = {
  all: "Browse Properties",
  buy: "Properties for Sale",
  rent: "Properties for Rent",
};

// Phase 8: filters, search words and sort live in the same URL as the Buy/Rent tab and the page number
// (see lib/search.ts). Switching tab keeps them, except the price range: sale prices and monthly rents
// are on very different scales, so a range chosen for one would just empty the other.
function tabHref(state: SearchState, key: ListingFilter): string {
  const next: Partial<SearchState> = { ...state, listing: key, page: 1 };
  if (key !== state.listing) {
    next.minPrice = null;
    next.maxPrice = null;
  }
  return buildHref(next);
}

// One removable chip per active filter; each links to the same search without that filter.
function activeChips(state: SearchState): { label: string; href: string }[] {
  const without = (patch: Partial<SearchState>) => buildHref({ ...state, ...patch, page: 1 });
  const chips: { label: string; href: string }[] = [];
  if (state.q) chips.push({ label: `“${state.q}”`, href: without({ q: "" }) });
  const type = TYPE_OPTIONS.find((t) => t.slug === state.type);
  if (type) chips.push({ label: type.label, href: without({ type: "" }) });
  const area = AREA_OPTIONS.find((a) => a.slug === state.area);
  if (area) chips.push({ label: area.label, href: without({ area: "" }) });
  if (state.city) chips.push({ label: state.city, href: without({ city: "" }) });
  if (state.minPrice !== null || state.maxPrice !== null) {
    chips.push({ label: priceLabel(state.minPrice, state.maxPrice), href: without({ minPrice: null, maxPrice: null }) });
  }
  if (state.beds !== null) chips.push({ label: `${state.beds}+ bedrooms`, href: without({ beds: null }) });
  return chips;
}

function PageHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

async function Listings({ searchParams }: { searchParams: SearchParams }) {
  const state = parseSearch(searchParams);
  const { listing, page } = state;
  const filtered = hasActiveFilters(state);
  const [result, locations] = await Promise.all([getProperties(state), getLocations()]);

  const totalPages = result.ok ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const chips = activeChips(state);
  const clearHref = buildHref({ listing });
  const title = filtered && listing === "all" ? "Search Results" : TITLES[listing];

  return (
    <>
      {/* Every filter/sort combination is its own URL; keep those out of search engines (the plain tabs stay indexable). */}
      {filtered && <meta name="robots" content="noindex, follow" />}
      <PageHead title={title}>
        {result.ok && result.total > 0 && (
          <p className="page-head-count">
            {filtered
              ? result.total === 1
                ? "1 property matches your search"
                : `${result.total} properties match your search`
              : `${result.total} ${result.total === 1 ? "property" : "properties"}`}
          </p>
        )}
        <div className="listing-tabs" role="navigation" aria-label="Listing type">
          {TABS.map((t) => (
            <Link key={t.key} href={tabHref(state, t.key)} aria-current={t.key === listing ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </div>
      </PageHead>

      {/* key = the URL, so the form fields reset when the URL changes (Back button, chips, Clear all). */}
      <PropertyFilters key={buildHref({ ...state, page: 1 })} state={state} locations={locations} />

      {chips.length > 0 && (
        <div className="filter-chips" aria-label="Active filters">
          {chips.map((c) => (
            <Link key={c.href} className="filter-chip" href={c.href} aria-label={`Remove filter: ${c.label}`}>
              {c.label} <span aria-hidden="true">×</span>
            </Link>
          ))}
        </div>
      )}

      <div className="cards cards-grid">
        {!result.ok ? (
          <p className="cards-note">Listings are unavailable right now. Please check back shortly or send an inquiry.</p>
        ) : result.total === 0 && filtered ? (
          <p className="cards-note">
            No properties match your search. <Link href={clearHref}>Clear all filters</Link> to see every listing, or send an inquiry
            and Marie Chris will help you find the right property.
          </p>
        ) : result.total === 0 ? (
          <p className="cards-note">
            {listing === "rent" ? "No properties for rent yet." : listing === "buy" ? "No properties for sale yet." : "New listings are coming soon."} Send an
            inquiry and Marie Chris will help you find the right property.
          </p>
        ) : result.data.length === 0 ? (
          <p className="cards-note">
            There are no more listings on this page. <Link href={buildHref({ ...state, page: 1 })}>Back to the first page</Link>.
          </p>
        ) : (
          result.data.map((p) => <PropertyCard key={p.id} p={p} />)
        )}
      </div>

      {result.ok && totalPages > 1 && (
        <div className="pagination" role="navigation" aria-label="Pages">
          {page > 1 ? (
            <Link href={buildHref({ ...state, page: page - 1 })} rel="prev">
              ← Previous
            </Link>
          ) : (
            <span className="disabled">← Previous</span>
          )}
          <span className="pagination-status">
            Page {Math.min(page, totalPages)} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={buildHref({ ...state, page: page + 1 })} rel="next">
              Next →
            </Link>
          ) : (
            <span className="disabled">Next →</span>
          )}
        </div>
      )}
    </>
  );
}

export default function PropertiesPage(props: { searchParams: SearchParams }) {
  return (
    <SiteShell>
      <section className="listing-page">
        <div className="wrap">
          <Suspense
            fallback={
              <>
                <PageHead title="Properties" />
                <div className="cards cards-grid">
                  <PropertyCardSkeletons count={6} />
                </div>
              </>
            }
          >
            <Listings searchParams={props.searchParams} />
          </Suspense>
        </div>
      </section>
    </SiteShell>
  );
}
