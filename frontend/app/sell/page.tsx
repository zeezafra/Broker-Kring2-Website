import type { Metadata } from "next";
import SellForm from "@/components/SellForm";
import SiteShell from "@/components/SiteShell";
import { broker } from "@/lib/broker";
import { sellPage } from "@/lib/sell";

// Phase 11. Hidden from search engines until the broker approves the wording (lib/sell.ts).
export const metadata: Metadata = {
  alternates: { canonical: "/sell" },
  title: `Sell or Appraise Your Property | ${broker.brand}`,
  description: `Send an inquiry to ${broker.fullName}, ${broker.title} in ${broker.location}, about selling or appraising your property.`,
  robots: sellPage.approved ? undefined : { index: false, follow: true },
};

export default function SellPage() {
  return (
    <SiteShell>
      <section className="sell">
        <div className="wrap sell-grid">
          <div className="sell-copy">
            <div className="broker-title">{broker.title}</div>
            <h1>{sellPage.title}</h1>
            <p className="sell-intro">{sellPage.intro}</p>
            <dl className="about-creds sell-creds">
              <div>
                <dt>PRC Lic. No.</dt>
                <dd>{broker.prcLicenseNo}</dd>
              </div>
              <div>
                <dt>DHSUD Reg. No.</dt>
                <dd>{broker.dhsudRegNo}</dd>
              </div>
            </dl>
            {!sellPage.approved && (
              <p className="bio-placeholder">
                <strong>Draft wording.</strong> The text on this page is a placeholder until Marie Chris has approved it.
              </p>
            )}
          </div>
          <div className="sell-card">
            <SellForm />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
