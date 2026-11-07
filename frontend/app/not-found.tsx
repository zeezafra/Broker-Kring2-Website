import Link from "next/link";
import SiteShell from "@/components/SiteShell";

// Any URL that matches no page. Brings its own header and footer, like the property not-found page.
export default function NotFound() {
  return (
    <SiteShell>
      <section className="page-head">
        <div className="wrap">
          <h1>Page not found</h1>
          <p>The page you are looking for does not exist or has moved.</p>
          <p className="page-head-action">
            <Link className="gold-btn" href="/">
              Back to home
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
