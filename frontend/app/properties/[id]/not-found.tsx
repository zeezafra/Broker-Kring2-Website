import Link from "next/link";
import SiteShell from "@/components/SiteShell";

// Rendered in place of the whole page, so it brings its own header and footer.
export default function PropertyNotFound() {
  return (
    <SiteShell>
      <section className="page-head">
        <div className="wrap">
          <h1>Property not found</h1>
          <p>This listing may have been removed or is no longer available.</p>
          <p className="page-head-action">
            <Link className="gold-btn" href="/properties">
              Browse all properties
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
