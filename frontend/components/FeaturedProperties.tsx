import Link from "next/link";
import { Suspense } from "react";
import { getFeaturedProperties } from "@/lib/public-api";
import { InquireButton } from "./InquiryModal";
import { PropertyCard, PropertyCardSkeletons } from "./PropertyCard";

// Live featured listings from the API. Runs on the server inside <Suspense> so the rest of the
// home page renders immediately while the API (which may be waking up on a free host) responds.
async function FeaturedCards() {
  const result = await getFeaturedProperties();

  if (!result.ok) {
    return <p className="cards-note">Listings are unavailable right now. Please check back shortly or send an inquiry.</p>;
  }
  if (result.data.length === 0) {
    return <p className="cards-note">New listings are coming soon. Send an inquiry and Marie Chris will help you find the right property.</p>;
  }

  return (
    <>
      {result.data.map((p) => (
        <PropertyCard key={p.id} p={p} />
      ))}
    </>
  );
}

export default function FeaturedProperties() {
  return (
    <section className="featured" id="properties">
      <div className="wrap">
        <div className="section-head">
          <h2>Featured Properties</h2>
          <div className="head-rule"></div>
          <Link className="view-all" href="/properties">
            View All Properties <span>→</span>
          </Link>
        </div>
        <div className="cards">
          <Suspense fallback={<PropertyCardSkeletons />}>
            <FeaturedCards />
          </Suspense>
        </div>
        <div className="feature-cta">
          <InquireButton>Inquire Now &nbsp; →</InquireButton>
        </div>
      </div>
    </section>
  );
}
