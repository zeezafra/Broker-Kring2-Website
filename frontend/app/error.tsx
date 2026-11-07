"use client";

import Link from "next/link";

// Last-resort screen if a page throws. Plain on purpose: it must not depend on anything that may have failed.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="page-head">
      <div className="wrap">
        <h1>Something went wrong</h1>
        <p>Please try again. If it keeps happening, call or email Marie Chris directly.</p>
        <p className="page-head-action">
          <button className="gold-btn" onClick={reset}>
            Try again
          </button>{" "}
          <Link className="gold-btn" href="/">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
