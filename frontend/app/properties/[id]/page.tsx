import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PropertyDetail from "@/components/PropertyDetail";
import SiteShell from "@/components/SiteShell";
import { PROPERTY_TYPE_LABELS } from "@/lib/admin-api";
import { cardImage, formatPrice, getProperty, locationLine } from "@/lib/public-api";

const SITE = "Cebu Properties by MCT";

// params is runtime data, so it is awaited inside <Suspense> / generateMetadata (required with cacheComponents).
// fetch() is memoized, so the metadata and the page share one API call.
export async function generateMetadata({ params }: PageProps<"/properties/[id]">): Promise<Metadata> {
  const { id } = await params;
  const result = await getProperty(id);
  if (!result.ok) return { title: `${result.notFound ? "Property not found" : "Property"} | ${SITE}` };

  const p = result.data;
  const where = locationLine(p);
  const summary = `${PROPERTY_TYPE_LABELS[p.propertyType]} ${p.listingType === "RENT" ? "for rent" : "for sale"}${where ? ` in ${where}` : ""} at ${formatPrice(p)}.`;
  const description = p.description ? p.description.replace(/\s+/g, " ").slice(0, 155) : summary;

  return {
    title: `${p.title} | ${SITE}`,
    description,
    openGraph: {
      title: p.title,
      description,
      ...(p.images[0] ? { images: [{ url: cardImage(p.images[0], 1200) }] } : {}),
    },
  };
}

async function Detail({ params }: { params: PageProps<"/properties/[id]">["params"] }) {
  const { id } = await params;
  const result = await getProperty(id);

  if (!result.ok) {
    if (result.notFound) notFound();
    return (
      <section className="detail">
        <div className="wrap">
          <p className="cards-note">
            This listing is unavailable right now. Please try again shortly, or <Link href="/properties">browse all properties</Link>.
          </p>
        </div>
      </section>
    );
  }
  return <PropertyDetail p={result.data} />;
}

function DetailSkeleton() {
  return (
    <section className="detail" aria-hidden="true">
      <div className="wrap">
        <div className="detail-grid">
          <div className="gallery">
            <div className="gallery-main skeleton-block" />
          </div>
          <div className="detail-panel">
            <span className="skeleton-bar" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PropertyPage(props: PageProps<"/properties/[id]">) {
  return (
    <SiteShell>
      <Suspense fallback={<DetailSkeleton />}>
        <Detail params={props.params} />
      </Suspense>
    </SiteShell>
  );
}
