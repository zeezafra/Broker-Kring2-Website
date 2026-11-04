import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PropertyCard, PropertyCardSkeletons } from "@/components/PropertyCard";
import SiteShell from "@/components/SiteShell";
import { getProperties, PAGE_SIZE, type ListingFilter } from "@/lib/public-api";

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

function parseListing(v: string | string[] | undefined): ListingFilter {
  return v === "buy" || v === "rent" ? v : "all";
}

function parsePage(v: string | string[] | undefined): number {
  if (typeof v !== "string" || !/^\d+$/.test(v)) return 1;
  return Math.min(Math.max(Number(v), 1), 10_000);
}

// Phase 8 will add search/sort/filters to this same URL; Phase 7 only has Buy/Rent and paging.
function href(listing: ListingFilter, page: number): string {
  const qs = new URLSearchParams();
  if (listing !== "all") qs.set("listing", listing);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `/properties?${s}` : "/properties";
}

function PageHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

async function Listings({ searchParams }: { searchParams: PageProps<"/properties">["searchParams"] }) {
  const sp = await searchParams;
  const listing = parseListing(sp.listing);
  const page = parsePage(sp.page);
  const result = await getProperties({ listing, page });

  const totalPages = result.ok ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHead title={TITLES[listing]}>
        {result.ok && result.total > 0 && (
          <p className="page-head-count">
            {result.total} {result.total === 1 ? "property" : "properties"}
          </p>
        )}
        <div className="listing-tabs" role="navigation" aria-label="Listing type">
          {TABS.map((t) => (
            <Link key={t.key} href={href(t.key, 1)} aria-current={t.key === listing ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </div>
      </PageHead>

      <div className="cards cards-grid">
        {!result.ok ? (
          <p className="cards-note">Listings are unavailable right now. Please check back shortly or send an inquiry.</p>
        ) : result.total === 0 ? (
          <p className="cards-note">
            {listing === "rent" ? "No properties for rent yet." : listing === "buy" ? "No properties for sale yet." : "New listings are coming soon."} Send an
            inquiry and Marie Chris will help you find the right property.
          </p>
        ) : result.data.length === 0 ? (
          <p className="cards-note">
            There are no more listings on this page. <Link href={href(listing, 1)}>Back to the first page</Link>.
          </p>
        ) : (
          result.data.map((p) => <PropertyCard key={p.id} p={p} />)
        )}
      </div>

      {result.ok && totalPages > 1 && (
        <div className="pagination" role="navigation" aria-label="Pages">
          {page > 1 ? (
            <Link href={href(listing, page - 1)} rel="prev">
              ← Previous
            </Link>
          ) : (
            <span className="disabled">← Previous</span>
          )}
          <span className="pagination-status">
            Page {Math.min(page, totalPages)} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={href(listing, page + 1)} rel="next">
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

export default function PropertiesPage(props: PageProps<"/properties">) {
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
